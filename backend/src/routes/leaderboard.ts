import express, { Request, Response } from "express";
import PersonalBest from "../models/PersonalBest";
import User from "../models/User";
import asyncHandler from "../utils/asyncHandler";
import requireAuth from "../middleware/requireAuth";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { mode, modeDetail, limit } = req.query;
    if (!mode) return res.status(400).json({ error: "mode query param is required" });

    const lim = Math.min(parseInt(String(limit), 10) || 50, 100);
    const detail = String(modeDetail ?? "-");

    // Fully served by the { mode: 1, modeDetail: 1, wpm: -1 } index: no
    // in-memory scan/sort, DB does the ranking and only the top `lim`
    // documents ever leave Mongo.
    const rows = await PersonalBest.find({ mode: String(mode), modeDetail: detail })
      .sort({ wpm: -1 })
      .limit(lim)
      .select("userId username wpm accuracy consistency -_id")
      .lean();

    const avatarUsers = await User.find({ _id: { $in: rows.map((r) => r.userId) } })
      .select("_id avatarUrl")
      .lean();
    const avatarByUserId = new Map(avatarUsers.map((u) => [String(u._id), u.avatarUrl]));

    res.json({
      leaderboard: rows.map(({ userId, ...r }) => ({ ...r, avatarUrl: avatarByUserId.get(String(userId)) || null })),
    });
  })
);

// Where the caller stands in one category, for pinning "you" under a
// top-N list when you are not in it. Rank = 1 + how many people are
// strictly faster (an index-backed count, no scan).
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { mode, modeDetail } = req.query;
    if (!mode) return res.status(400).json({ error: "mode query param is required" });
    const detail = String(modeDetail ?? "-");

    const mine = await PersonalBest.findOne({ userId: req.userId, mode: String(mode), modeDetail: detail })
      .select("username wpm accuracy consistency -_id")
      .lean();
    if (!mine) return res.json({ entry: null });

    const ahead = await PersonalBest.countDocuments({ mode: String(mode), modeDetail: detail, wpm: { $gt: mine.wpm } });
    const user = await User.findById(req.userId).select("avatarUrl").lean();
    res.json({ entry: { rank: ahead + 1, ...mine, avatarUrl: user?.avatarUrl ?? null } });
  })
);

export default router;
