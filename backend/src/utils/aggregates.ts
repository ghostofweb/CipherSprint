// Server-side port of src/Utils/resultsHistory.js's getAggregates() logic,
// adapted to update denormalized per-user totals incrementally (one new
// Result at a time) instead of rescanning full history on every read.

import { Types } from "mongoose";
import type { UserAggregates } from "@ciphersprint/shared";
import PersonalBest from "../models/PersonalBest";
import { IUser } from "../models/User";

const dayKey = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface Streak {
  current: number;
  max: number;
}

function computeStreak(testActivity: Record<string, number>): Streak {
  const activeDays = Object.keys(testActivity).sort();
  let maxStreak = 0;
  let running = 0;
  let prevDate: Date | null = null;
  for (const day of activeDays) {
    const d = new Date(day);
    if (prevDate !== null) {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
      running = diffDays === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    maxStreak = Math.max(maxStreak, running);
    prevDate = d;
  }
  let currentStreak = 0;
  if (activeDays.length > 0) {
    const today = dayKey(Date.now());
    const yesterday = dayKey(Date.now() - 86400000);
    const lastActive = activeDays[activeDays.length - 1];
    if (lastActive === today || lastActive === yesterday) {
      currentStreak = running;
    }
  }
  return { current: currentStreak, max: maxStreak };
}

interface ResultLike {
  mode: string;
  modeDetail?: string | number | null;
  wpm: number;
  accuracy: number;
  consistency?: number;
  durationSeconds?: number;
  timestamp: number;
  charMistakes?: Record<string, number>;
}

// Mutates `user` (a Mongoose document) in place to fold in one new result.
// Caller is responsible for calling user.save().
export function applyResultToUser(user: IUser, result: ResultLike): void {
  user.completedTests += 1;
  user.totalTimeTypingSeconds += result.durationSeconds || 0;
  user.bestWpm = Math.max(user.bestWpm, result.wpm || 0);
  user.bestAccuracy = Math.max(user.bestAccuracy, result.accuracy || 0);
  user.bestConsistency = Math.max(user.bestConsistency, result.consistency || 0);

  const day = dayKey(result.timestamp);
  user.testActivity[day] = (user.testActivity[day] || 0) + 1;
  user.streak = computeStreak(user.testActivity);

  if (result.charMistakes) {
    for (const [char, count] of Object.entries(result.charMistakes)) {
      user.charMistakes[char] = (user.charMistakes[char] || 0) + count;
    }
  }

  user.recentScores.push({ wpm: result.wpm, accuracy: result.accuracy, consistency: result.consistency ?? 0 });
  if (user.recentScores.length > 10) user.recentScores.shift();

  user.markModified("testActivity");
  user.markModified("charMistakes");
}

interface UpsertPersonalBestInput {
  userId: Types.ObjectId;
  username: string;
  mode: string;
  modeDetail?: string | number | null;
  wpm: number;
  accuracy: number;
  consistency?: number;
  timestamp: number;
}

// Upserts the user's best score for one mode/modeDetail category. Two
// atomic single-document ops instead of a transaction: the first only
// applies when the new score beats the existing one, the second only
// inserts when no row exists yet for this user+category. Safe under
// concurrent writes -- worst case a losing write is a harmless no-op.
export async function upsertPersonalBest({ userId, username, mode, modeDetail, wpm, accuracy, consistency, timestamp }: UpsertPersonalBestInput): Promise<void> {
  const detail = String(modeDetail ?? "-");

  await PersonalBest.updateOne(
    { userId, mode, modeDetail: detail, wpm: { $lt: wpm } },
    { $set: { username, wpm, accuracy, consistency, timestamp } }
  );
  await PersonalBest.updateOne(
    { userId, mode, modeDetail: detail },
    { $setOnInsert: { userId, username, mode, modeDetail: detail, wpm, accuracy, consistency, timestamp } },
    { upsert: true }
  );
}

// Public-safe read shape shared by GET /api/auth/me and GET /api/users/:username.
export function summarize(user: IUser): UserAggregates {
  const avg = (key: "wpm" | "accuracy" | "consistency"): number =>
    user.recentScores.length
      ? Math.round(user.recentScores.reduce((s, r) => s + (r[key] || 0), 0) / user.recentScores.length)
      : 0;

  return {
    completedTests: user.completedTests,
    totalTimeTypingSeconds: user.totalTimeTypingSeconds,
    bestWpm: user.bestWpm,
    bestAccuracy: user.bestAccuracy,
    bestConsistency: user.bestConsistency,
    avgWpmLast10: avg("wpm"),
    avgAccuracyLast10: avg("accuracy"),
    avgConsistencyLast10: avg("consistency"),
    streak: user.streak,
    testActivity: user.testActivity,
    charMistakes: user.charMistakes,
  };
}

export { dayKey, computeStreak };
