import express, { Request, Response } from "express";
import { Types } from "mongoose";
import { friendRequestSchema } from "@ciphersprint/shared";
import User from "../models/User";
import Friendship, { IFriendship } from "../models/Friendship";
import DirectConversation from "../models/DirectConversation";
import ConversationRead from "../models/ConversationRead";
import Message from "../models/Message";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { canonicalPair } from "../utils/chatAccess";
import { getIO, isOnline } from "../socket";

const router = express.Router();
router.use(requireAuth);

// After any friend mutation, tell the actor's *own* sessions (other tabs,
// other devices) to refresh: the per-recipient events below only reach the
// other person.
const syncOwnSessions = (userId: unknown) => getIO()?.to(`user:${userId}`).emit("friends:changed");

interface PopulatedParty {
  _id: Types.ObjectId;
  username: string;
  avatarUrl: string | null;
  showPresence?: boolean;
}

function otherUser(friendship: IFriendship & { requester: PopulatedParty; recipient: PopulatedParty }, myId: string) {
  const mine = String(friendship.requester._id) === String(myId);
  return mine ? friendship.recipient : friendship.requester;
}

router.post(
  "/requests",
  validateBody(friendRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;

    const target = await User.findOne({ username });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (String(target._id) === String(req.userId)) {
      return res.status(400).json({ error: "You can't friend yourself" });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: target._id },
        { requester: target._id, recipient: req.userId },
      ],
    });
    if (existing) {
      return res.status(409).json({ error: existing.status === "accepted" ? "Already friends" : "Request already pending" });
    }

    const friendship = await Friendship.create({ requester: req.userId, recipient: target._id });

    const me = await User.findById(req.userId).select("username avatarUrl").lean();
    getIO()?.to(`user:${target._id}`).emit("friend:request", {
      id: friendship._id,
      username: me?.username,
      avatarUrl: me?.avatarUrl ?? null,
    });

    syncOwnSessions(req.userId);
    res.status(201).json({ id: friendship._id });
  })
);

router.get(
  "/requests",
  asyncHandler(async (req: Request, res: Response) => {
    const [incoming, outgoing] = await Promise.all([
      Friendship.find({ recipient: req.userId, status: "pending" }).populate("requester", "username avatarUrl").lean(),
      Friendship.find({ requester: req.userId, status: "pending" }).populate("recipient", "username avatarUrl").lean(),
    ]);

    res.json({
      incoming: incoming.map((f: any) => ({ id: f._id, username: f.requester.username, avatarUrl: f.requester.avatarUrl, createdAt: f.createdAt })),
      outgoing: outgoing.map((f: any) => ({ id: f._id, username: f.recipient.username, avatarUrl: f.recipient.avatarUrl, createdAt: f.createdAt })),
    });
  })
);

router.post(
  "/requests/:id/accept",
  asyncHandler(async (req: Request, res: Response) => {
    const friendship = await Friendship.findById(req.params.id);
    if (!friendship || String(friendship.recipient) !== String(req.userId)) {
      return res.status(404).json({ error: "Request not found" });
    }
    friendship.status = "accepted";
    await friendship.save();

    const me = await User.findById(req.userId).select("username avatarUrl").lean();
    getIO()?.to(`user:${friendship.requester}`).emit("friend:accepted", {
      username: me?.username,
      avatarUrl: me?.avatarUrl ?? null,
    });

    syncOwnSessions(req.userId);
    res.json({ status: "accepted" });
  })
);

router.delete(
  "/requests/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ error: "Request not found" });
    const isParty = [String(friendship.requester), String(friendship.recipient)].includes(String(req.userId));
    if (!isParty) return res.status(404).json({ error: "Request not found" });

    const otherId = String(friendship.requester) === String(req.userId) ? friendship.recipient : friendship.requester;
    await friendship.deleteOne();
    getIO()?.to(`user:${otherId}`).emit("friend:declined", { requestId: req.params.id });
    syncOwnSessions(req.userId);

    res.json({ ok: true });
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const friendships = await Friendship.find({
      $or: [{ requester: req.userId }, { recipient: req.userId }],
      status: "accepted",
    })
      .populate("requester", "username avatarUrl showPresence")
      .populate("recipient", "username avatarUrl showPresence")
      .lean();

    const friends = (friendships as any[]).map((f) => otherUser(f, req.userId as string));

    // Batch-fetch each friend's DM conversation (if one exists yet) in one
    // query, then each side's unread count individually (bounded by this
    // user's own friend count, not global data -- fine at this scale).
    const pairs = friends.map((f) => canonicalPair(req.userId as string, String(f._id)));
    const convos = pairs.length
      ? await DirectConversation.find({
          $or: pairs.map(([a, b]) => ({ participantA: a, participantB: b })),
        }).lean()
      : [];
    const convoByFriendId = new Map<string, (typeof convos)[number]>();
    for (const c of convos) {
      const otherId = String(c.participantA) === String(req.userId) ? c.participantB : c.participantA;
      convoByFriendId.set(String(otherId), c);
    }

    const reads = convos.length
      ? await ConversationRead.find({
          userId: req.userId,
          contextType: "dm",
          contextId: { $in: convos.map((c) => c._id) },
        }).lean()
      : [];
    const readByContextId = new Map(reads.map((r) => [String(r.contextId), r.lastReadAt]));

    const results = await Promise.all(
      friends.map(async (friend) => {
        const convo = convoByFriendId.get(String(friend._id));
        let unreadCount = 0;
        if (convo) {
          const lastReadAt = readByContextId.get(String(convo._id)) || new Date(0);
          unreadCount = await Message.countDocuments({
            contextType: "dm",
            contextId: convo._id,
            createdAt: { $gt: lastReadAt },
            senderId: { $ne: req.userId },
          });
        }
        return {
          userId: friend._id,
          username: friend.username,
          avatarUrl: friend.avatarUrl,
          dmConversationId: convo?._id ?? null,
          lastMessageText: convo?.lastMessageText ?? null,
          lastMessageSenderUsername: convo?.lastMessageSenderUsername ?? null,
          lastMessageAt: convo?.lastMessageAt ?? null,
          unreadCount,
          // A friend who opted out of presence always reads as offline.
          online: friend.showPresence !== false && isOnline(String(friend._id)),
        };
      })
    );

    results.sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

    res.json({ friends: results });
  })
);

router.delete(
  "/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    await Friendship.deleteOne({
      status: "accepted",
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId },
      ],
    });
    getIO()?.to(`user:${req.params.userId}`).emit("friend:removed", { userId: req.userId });
    syncOwnSessions(req.userId);

    res.json({ ok: true });
  })
);

export default router;
