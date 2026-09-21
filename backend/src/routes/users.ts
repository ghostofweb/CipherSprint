import express, { Request, Response } from "express";
import { visibilitySchema, presenceSchema, avatarUpdateSchema, type UserSearchResult, type Relationship } from "@ciphersprint/shared";
import User from "../models/User";
import Friendship from "../models/Friendship";
import PersonalBest from "../models/PersonalBest";
import requireAuth from "../middleware/requireAuth";
import optionalAuth from "../middleware/optionalAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { summarize } from "../utils/aggregates";
import { isOurCloudinaryUrl, destroyAsset } from "../utils/cloudinary";
import { escapeRegex } from "../utils/regex";
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

    // Tell friends right away (offline when turned off, online when turned
    // back on while connected) instead of waiting for the next reconnect.
    await syncPresenceVisibility(String(user._id), user.showPresence);
    res.json({ showPresence: user.showPresence });
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
  asyncHandler(async (req: Request, res: Response) => {
    // People paste IDs as "#4F2A91" as often as "4F2A91".
    const q = String(req.query.q || "").trim().replace(/^#/, "");
    if (!q) return res.json({ users: [] });

    const asId = q.toUpperCase();
    const isIdShape = PUBLIC_ID_SHAPE.test(asId);
    // A single character matches a large share of the user base and is
    // never a useful search; an exact public ID is always 8 characters.
    if (q.length < 2 && !isIdShape) return res.json({ users: [] });

    const users = await User.find({
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
    });
  })
);

export default router;
