import express, { Request, Response } from "express";
import { createGroupSchema, avatarUpdateSchema } from "@ciphersprint/shared";
import Group from "../models/Group";
import GroupMember from "../models/GroupMember";
import Message from "../models/Message";
import User from "../models/User";
import ConversationRead from "../models/ConversationRead";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { isGroupMember } from "../utils/chatAccess";
import { isOurCloudinaryUrl, destroyAsset } from "../utils/cloudinary";
import { escapeRegex } from "../utils/regex";

const router = express.Router();
router.use(requireAuth);

router.post(
  "/",
  validateBody(createGroupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;

    // Names are unique case-insensitively ("Chooms" and "CHOOMS" would be
    // indistinguishable in a list).
    const nameLower = name.toLowerCase();
    const existing = await Group.findOne({ $or: [{ nameLower }, { name }] });
    if (existing) return res.status(409).json({ error: "A group with that name already exists" });

    const owner = await User.findById(req.userId).select("username").lean();
    if (!owner) return res.status(404).json({ error: "User not found" });
    const group = await Group.create({ name, nameLower, description, ownerId: req.userId });
    await GroupMember.create({ groupId: group._id, userId: req.userId, username: owner.username, role: "owner" });

    res.status(201).json({ group });
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Anchored prefix match on the lowercased name ("cho" finds "CHOOMS");
    // the old $text search only matched whole words.
    const q = String(req.query.search || "").trim().toLowerCase();
    const query = q ? { nameLower: { $regex: `^${escapeRegex(q)}` } } : {};
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 100);
    const sort: Record<string, 1 | -1> = req.query.sort === "new" ? { createdAt: -1 } : { memberCount: -1, createdAt: -1 };

    const groups = await Group.find(query).sort(sort).limit(limit).lean();

    // Flag the ones the caller already belongs to (one query over this page).
    const memberships = groups.length
      ? await GroupMember.find({ userId: req.userId, groupId: { $in: groups.map((g) => g._id) } })
          .select("groupId -_id")
          .lean()
      : [];
    const joined = new Set(memberships.map((m) => String(m.groupId)));

    res.json({ groups: groups.map((g) => ({ ...g, isMember: joined.has(String(g._id)) })) });
  })
);

// Registered before "/:id" -- otherwise Express would treat "mine" as an
// :id value and Mongoose would throw casting it to an ObjectId.
router.get(
  "/mine",
  asyncHandler(async (req: Request, res: Response) => {
    const memberships = await GroupMember.find({ userId: req.userId }).select("groupId -_id").lean();
    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return res.json({ groups: [] });

    const groups = await Group.find({ _id: { $in: groupIds } }).lean();
    const reads = await ConversationRead.find({
      userId: req.userId,
      contextType: "group",
      contextId: { $in: groupIds },
    }).lean();
    const readByGroupId = new Map(reads.map((r) => [String(r.contextId), r.lastReadAt]));

    const results = await Promise.all(
      groups.map(async (g) => {
        const lastReadAt = readByGroupId.get(String(g._id)) || new Date(0);
        const unreadCount = await Message.countDocuments({
          contextType: "group",
          contextId: g._id,
          createdAt: { $gt: lastReadAt },
          senderId: { $ne: req.userId },
        });
        return { ...g, unreadCount };
      })
    );

    results.sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

    res.json({ groups: results });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ error: "Group not found" });
    const isMember = await isGroupMember(group._id, req.userId as string);

    const memberDocs = await GroupMember.find({ groupId: group._id })
      .select("userId username role -_id")
      .limit(200)
      .lean();
    const memberUsers = await User.find({ _id: { $in: memberDocs.map((m) => m.userId) } })
      .select("_id avatarUrl")
      .lean();
    const avatarByUserId = new Map(memberUsers.map((u) => [String(u._id), u.avatarUrl]));
    const members = memberDocs.map((m) => ({
      username: m.username,
      role: m.role,
      avatarUrl: avatarByUserId.get(String(m.userId)) || null,
    }));

    res.json({ group, isMember, members });
  })
);

router.post(
  "/:id/join",
  asyncHandler(async (req: Request, res: Response) => {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const already = await isGroupMember(group._id, req.userId as string);
    if (already) return res.json({ ok: true });

    const me = await User.findById(req.userId).select("username").lean();
    if (!me) return res.status(404).json({ error: "User not found" });
    await GroupMember.create({ groupId: group._id, userId: req.userId, username: me.username, role: "member" });
    await Group.updateOne({ _id: group._id }, { $inc: { memberCount: 1 } });

    res.json({ ok: true });
  })
);

router.post(
  "/:id/leave",
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await GroupMember.findOne({ groupId: req.params.id, userId: req.userId });
    if (!membership) return res.status(404).json({ error: "You're not a member of this group" });

    await membership.deleteOne();
    await Group.updateOne({ _id: req.params.id }, { $inc: { memberCount: -1 } });

    if (membership.role === "owner") {
      const nextOwner = await GroupMember.findOne({ groupId: req.params.id }).sort({ joinedAt: 1 });
      if (nextOwner) {
        nextOwner.role = "owner";
        await nextOwner.save();
        await Group.updateOne({ _id: req.params.id }, { ownerId: nextOwner.userId });
      } else {
        await Group.deleteOne({ _id: req.params.id });
        await Message.deleteMany({ contextType: "group", contextId: req.params.id });
      }
    }

    res.json({ ok: true });
  })
);

router.patch(
  "/:id/avatar",
  validateBody(avatarUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { url, publicId } = req.body;
    if (!isOurCloudinaryUrl(url)) {
      return res.status(400).json({ error: "Invalid avatar upload" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (String(group.ownerId) !== String(req.userId)) {
      return res.status(403).json({ error: "Only the group owner can change its avatar" });
    }

    const oldPublicId = group.avatarPublicId;
    group.avatarUrl = url;
    group.avatarPublicId = publicId;
    await group.save();
    await destroyAsset(oldPublicId);

    res.json({ avatarUrl: group.avatarUrl });
  })
);

router.get(
  "/:id/messages",
  asyncHandler(async (req: Request, res: Response) => {
    const member = await isGroupMember(req.params.id, req.userId as string);
    if (!member) return res.status(403).json({ error: "You're not a member of this group" });

    const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 100);
    const query: Record<string, unknown> = { contextType: "group", contextId: req.params.id };
    if (req.query.before) query.createdAt = { $lt: new Date(Number(req.query.before)) };

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ messages: messages.reverse() });
  })
);

export default router;
