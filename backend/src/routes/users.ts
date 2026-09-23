import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { visibilitySchema, presenceSchema, avatarUpdateSchema, settingsSchema, blockUserSchema, deleteAccountSchema, type UserSearchResult, type Relationship, type RaceRecord, type RaceRecordEntry, type BlockedUser } from "@ciphersprint/shared";
import User from "../models/User";
import Friendship from "../models/Friendship";
import PersonalBest from "../models/PersonalBest";
import Block from "../models/Block";
import Race from "../models/Race";
import { deleteAccount } from "../utils/accountDeletion";
import { getIO } from "../socket";
import requireAuth from "../middleware/requireAuth";
import optionalAuth from "../middleware/optionalAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { summarize } from "../utils/aggregates";
import { isOurCloudinaryUrl, destroyAsset } from "../utils/cloudinary";
import { escapeRegex } from "../utils/regex";
import { hiddenUserIds, isBlockedBetween } from "../utils/blocks";
import { rateLimit } from "../utils/rateLimit";
import { syncPresenceVisibility } from "../socket";

const router = express.Router();

// Public IDs are 8 characters (see utils/ids.ts).
const PUBLIC_ID_SHAPE = /^[A-Z0-9]{8}$/;

router.patch(
  "/me/visibility",
  requireAuth,
  validateBody(visibilitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(req.userId, { isPublic: req.body.isPublic }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ isPublic: user.isPublic });
  })
);

router.patch(
  "/me/presence",
  requireAuth,
  validateBody(presenceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(req.userId, { showPresence: req.body.showPresence }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    await syncPresenceVisibility(String(user._id), user.showPresence);
    res.json({ showPresence: user.showPresence });
  })
);

// Settings follow the account across devices. The client sends the whole
// object with its own updatedAt; an older copy never overwrites a newer one.
router.get(
  "/me/settings",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId).select("settings").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ settings: user.settings ?? null });
  })
);

router.put(
  "/me/settings",
  requireAuth,
  validateBody(settingsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const incoming = req.body;
    const updated = await User.findOneAndUpdate(
      { _id: req.userId, $or: [{ settings: null }, { "settings.updatedAt": { $lte: incoming.updatedAt } }] },
      { settings: incoming },
      { new: true }
    )
      .select("settings")
      .lean();
    if (updated) return res.json({ settings: updated.settings, applied: true });
    const current = await User.findById(req.userId).select("settings").lean();
    if (!current) return res.status(404).json({ error: "User not found" });
    res.json({ settings: current.settings, applied: false });
  })
);

// ---- Blocking ----

router.get(
  "/me/blocks",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await Block.find({ blocker: req.userId }).sort({ createdAt: -1 }).populate("blocked", "username avatarUrl").lean();
    const blocked: BlockedUser[] = rows
      .filter((r) => r.blocked)
      .map((r) => {
        const u = r.blocked as unknown as { username: string; avatarUrl: string | null };
        return { username: u.username, avatarUrl: u.avatarUrl ?? null, blockedAt: new Date(r.createdAt).toISOString() };
      });
    res.json({ blocked });
  })
);

// Blocking also ends any friendship or pending request between the two.
router.post(
  "/me/blocks",
  requireAuth,
  validateBody(blockUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const target = await User.findOne({ username: req.body.username }).select("_id username").lean();
    if (!target) return res.status(404).json({ error: "User not found" });
    if (String(target._id) === String(req.userId)) return res.status(400).json({ error: "You can't block yourself." });
    await Block.updateOne(
      { blocker: req.userId, blocked: target._id },
      { $setOnInsert: { blocker: req.userId, blocked: target._id } },
      { upsert: true }
    );
    const removed = await Friendship.deleteMany({
      $or: [
        { requester: req.userId, recipient: target._id },
        { requester: target._id, recipient: req.userId },
      ],
    });
    // Both sides refresh their lists; the blocked person is not told why.
    if (removed.deletedCount) {
      getIO()?.to(`user:${req.userId}`).emit("friends:changed");
      getIO()?.to(`user:${target._id}`).emit("friends:changed");
    }
    res.json({ ok: true });
  })
);

router.delete(
  "/me/blocks/:username",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const target = await User.findOne({ username: req.params.username }).select("_id").lean();
    if (target) await Block.deleteOne({ blocker: req.userId, blocked: target._id });
    res.json({ ok: true });
  })
);

// ---- Delete account ----

router.delete(
  "/me",
  requireAuth,
  rateLimit({ key: "delete-account", max: 10, windowMs: 15 * 60 * 1000 }),
  validateBody(deleteAccountSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (req.body.confirm !== user.username) {
      return res.status(400).json({ error: `Type your username, ${user.username}, to confirm.` });
    }
    if (user.passwordHash && !(await bcrypt.compare(req.body.password ?? "", user.passwordHash))) {
      return res.status(401).json({ error: "That password isn't right." });
    }
    await deleteAccount(String(user._id));
    // Any other open tab of this account is now signed out.
    getIO()?.in(`user:${user._id}`).disconnectSockets(true);
    res.json({ ok: true });
  })
);

router.patch(
  "/me/avatar",
  requireAuth,
  validateBody(avatarUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { url, publicId } = req.body;
    if (!isOurCloudinaryUrl(url)) {
      return res.status(400).json({ error: "Invalid avatar upload" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const oldPublicId = user.avatarPublicId;
    user.avatarUrl = url;
    user.avatarPublicId = publicId;
    await user.save();
    await destroyAsset(oldPublicId);

    res.json({ avatarUrl: user.avatarUrl });
  })
);

router.get(
  "/search",
  requireAuth,
  rateLimit({ key: "search", max: 60, windowMs: 60 * 1000, message: "Searching too fast. Wait a moment." }),
  asyncHandler(async (req: Request, res: Response) => {
    // People paste IDs as "#4F2A91" as often as "4F2A91".
    const q = String(req.query.q || "").trim().replace(/^#/, "");
    if (!q) return res.json({ users: [] });

    const asId = q.toUpperCase();
    const isIdShape = PUBLIC_ID_SHAPE.test(asId);
    // A single character matches a large share of the user base and is
    // never a useful search; an exact public ID is always 8 characters.
    if (q.length < 2 && !isIdShape) return res.json({ users: [] });

    // People who blocked you, or whom you blocked, are not findable.
    const hidden = await hiddenUserIds(String(req.userId));
    const users = await User.find({
      _id: { $nin: hidden },
      $or: [
        { usernameLower: { $regex: `^${escapeRegex(q.toLowerCase())}` } },
        ...(isIdShape ? [{ publicId: asId }] : []),
      ],
    })
      .select("_id username publicId avatarUrl")
      .sort({ usernameLower: 1 })
      .limit(10)
      .lean();

    // How the searcher relates to each hit, in one indexed query, so the UI
    // can offer the right action (add / requested / accept / message).
    const me = String(req.userId);
    const ids = users.map((u) => u._id);
    const links = ids.length
      ? await Friendship.find({
          $or: [
            { requester: req.userId, recipient: { $in: ids } },
            { requester: { $in: ids }, recipient: req.userId },
          ],
        })
          .select("requester recipient status")
          .lean()
      : [];
    const linkByOther = new Map<string, { status: string; mine: boolean; id: string }>();
    for (const f of links) {
      const mine = String(f.requester) === me;
      linkByOther.set(String(mine ? f.recipient : f.requester), { status: f.status, mine, id: String(f._id) });
    }

    const results: UserSearchResult[] = users.map((u) => {
      const id = String(u._id);
      let relationship: Relationship = "none";
      let requestId: string | undefined;
      if (id === me) {
        relationship = "self";
      } else {
        const link = linkByOther.get(id);
        if (link?.status === "accepted") {
          relationship = "friends";
        } else if (link) {
          relationship = link.mine ? "outgoing" : "incoming";
          requestId = link.id;
        }
      }
      return { username: u.username, publicId: u.publicId, avatarUrl: u.avatarUrl, relationship, ...(requestId ? { requestId } : {}) };
    });

    res.json({ users: results });
  })
);

router.get(
  "/:username",
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Someone who blocked you does not exist, as far as you can tell.
    const blockedMe = req.userId ? await Block.exists({ blocker: user._id, blocked: req.userId }) : null;
    if (blockedMe) return res.status(404).json({ error: "User not found" });
    const blockedByMe = req.userId ? Boolean(await Block.exists({ blocker: req.userId, blocked: user._id })) : false;

    const isOwner = !!req.userId && String(user._id) === String(req.userId);
    if (!user.isPublic && !isOwner) {
      return res.status(403).json({ error: "This profile is private" });
    }

    const personalBests = await PersonalBest.find({ userId: user._id })
      .select("mode modeDetail wpm accuracy consistency timestamp -_id")
      .lean();

    res.json({
      username: user.username,
      publicId: user.publicId,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      isPublic: user.isPublic,
      aggregates: summarize(user),
      personalBests,
      blockedByMe,
    });
  })
);

// Race record: totals, the head-to-head against whoever is looking, and the
// last ten races. Public whenever the profile is.
router.get(
  "/:username/races",
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ username: req.params.username }).select("_id isPublic").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const isOwner = !!req.userId && String(user._id) === String(req.userId);
    if (!user.isPublic && !isOwner) return res.status(403).json({ error: "This profile is private" });

    const id = String(user._id);
    const races = await Race.find({ "players.userId": user._id }).sort({ endedAt: -1 }).limit(500).lean();
    const record: RaceRecord = {
      wins: 0,
      losses: 0,
      ties: 0,
      headToHead: req.userId && !isOwner ? { wins: 0, losses: 0, ties: 0 } : null,
      recent: [],
    };

    // Opponent avatars for the recent list, in one query.
    const recentRaces = races.slice(0, 10);
    const opponentIds = recentRaces.flatMap((r) => r.players.filter((p) => String(p.userId) !== id).map((p) => p.userId));
    const avatars = new Map(
      (await User.find({ _id: { $in: opponentIds } }).select("avatarUrl").lean()).map((u) => [String(u._id), u.avatarUrl ?? null])
    );

    races.forEach((r, i) => {
      const result: RaceRecordEntry["result"] = !r.winnerId ? "tie" : String(r.winnerId) === id ? "win" : "loss";
      const bucket = result === "win" ? "wins" : result === "loss" ? "losses" : "ties";
      record[bucket] += 1;
      const other = r.players.find((p) => String(p.userId) !== id);
      if (record.headToHead && other && String(other.userId) === String(req.userId)) record.headToHead[bucket] += 1;
      if (i < 10) {
        const me = r.players.find((p) => String(p.userId) === id);
        const st = r.settings as { format?: string; seconds?: number; words?: number; quoteLength?: string };
        record.recent.push({
          code: r.code,
          endedAt: new Date(r.endedAt).toISOString(),
          format: st.format ?? "time",
          detail: st.format === "time" ? `${st.seconds}s` : st.format === "words" ? String(st.words) : String(st.quoteLength ?? ""),
          opponent: other ? { username: other.username, avatarUrl: avatars.get(String(other.userId)) ?? null } : null,
          wpm: me?.wpm ?? 0,
          opponentWpm: other?.wpm ?? null,
          result,
        });
      }
    });
    res.json(record);
  })
);

export default router;
