import express, { Request, Response } from "express";
import { resultSchema, categoryDetail } from "@ciphersprint/shared";
import Result from "../models/Result";
import User from "../models/User";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { applyResultToUser, upsertPersonalBest } from "../utils/aggregates";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  validateBody(resultSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;

    const result = await Result.create({
      userId: req.userId,
      mode: body.mode,
      modeDetail: body.modeDetail ?? null,
      wpm: body.wpm,
      rawWpm: body.rawWpm,
      accuracy: body.accuracy,
      consistency: body.consistency,
      correctChars: body.correctChars,
      incorrectChars: body.incorrectChars,
      missedChars: body.missedChars,
      extraChars: body.extraChars,
      correctWords: body.correctWords,
      charMistakes: body.charMistakes || {},
      durationSeconds: body.durationSeconds,
      timestamp: body.timestamp || Date.now(),
      language: body.language ?? "english",
      replay: body.replay,
      words: body.words,
      hasReplay: Boolean(body.replay?.length && body.words?.length),
    });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    applyResultToUser(user, result);
    await user.save();
    // Only standard tests rank; a practice or custom text is not comparable.
    const ranked = result.mode === "time" || result.mode === "words" || result.mode === "quote";
    const personalBest = !ranked ? { isNew: false, previous: null } : await upsertPersonalBest({
      userId: user._id,
      username: user.username,
      mode: result.mode,
      modeDetail: result.mode === "quote" ? result.modeDetail : categoryDetail(result.modeDetail, result.language),
      wpm: result.wpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      timestamp: result.timestamp,
    });

    const { replay: _r, words: _w, ...summary } = result.toObject();
    res.status(201).json({ result: summary, personalBest });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 200);
    const results = await Result.find({ userId: req.userId }).sort({ timestamp: -1 }).limit(limit);
    res.json({ results });
  })
);

// One result with its replay (only your own).
router.get(
  "/:id/replay",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await Result.findOne({ _id: req.params.id, userId: req.userId })
      .select("+replay +words mode modeDetail wpm accuracy timestamp language")
      .lean()
      .catch(() => null);
    if (!result) return res.status(404).json({ error: "Result not found" });
    if (!result.replay?.length || !result.words?.length) return res.status(404).json({ error: "This test has no replay." });
    res.json({ result });
  })
);

export default router;
