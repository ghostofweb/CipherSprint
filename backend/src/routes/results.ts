import express, { Request, Response } from "express";
import { resultSchema } from "@ciphersprint/shared";
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
    });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    applyResultToUser(user, result);
    await user.save();
    await upsertPersonalBest({
      userId: user._id,
      username: user.username,
      mode: result.mode,
      modeDetail: result.modeDetail,
      wpm: result.wpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      timestamp: result.timestamp,
    });

    res.status(201).json({ result });
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

export default router;
