import type { RaceFinishInput, RaceOutcome, RaceResults } from "@ciphersprint/shared";
import { MAX_FIXED_RACE_MS } from "./store";
import type { PlayerState, Room } from "./store";

// Final stats come from the client, so the server keeps the parts that
// decide a winner honest: it recomputes wpm/accuracy from raw counts, bounds
// the counts by what a keyboard can physically do, and measures finish order
// by its own clock rather than the client's.

// 30 characters a second is 360 wpm, above any recorded human burst.
const MAX_CHARS_PER_SECOND = 30;
const MAX_WPM = 400;
// A client can't finish faster than the server saw it, give or take the
// network. Beyond that slack the server's own elapsed time wins.
const LATENCY_SLACK_MS = 1500;

export type EndReason = "time" | "finish" | "forfeit" | "cap";

const maxTypedChars = (elapsedMs: number) => Math.ceil((elapsedMs / 1000) * MAX_CHARS_PER_SECOND) + 20;

// Caret position as one number (characters into the shared text).
export function positionOf(room: Room, word: number, char: number): number {
  if (room.offsets.length === 0) return 0;
  const w = Math.min(word, room.offsets.length - 1);
  return room.offsets[w] + char;
}

// Rejects a progress report that would need superhuman typing to reach.
export function isPlausibleProgress(room: Room, word: number, char: number, now: number): boolean {
  if (room.startsAt === null) return false;
  return positionOf(room, word, char) <= maxTypedChars(now - room.startsAt);
}

export function buildOutcome(
  room: Room,
  player: PlayerState,
  stats: RaceFinishInput["stats"],
  now: number
): RaceOutcome | { error: string } {
  const serverElapsed = Math.max(0, now - (room.startsAt ?? now));
  const timed = room.settings.format === "time";
  const nominal = room.settings.seconds * 1000;

  let elapsedMs: number;
  if (timed) {
    // Can't be over before the clock is.
    if (serverElapsed < nominal - 500) return { error: "That result arrived before the time was up." };
    elapsedMs = Math.min(Math.max(stats.elapsedMs, nominal), nominal + 500);
  } else {
    elapsedMs = Math.max(stats.elapsedMs, serverElapsed - LATENCY_SLACK_MS, 1);
  }

  const typed = stats.correctChars + stats.incorrectChars + stats.extraChars;
  if (typed > maxTypedChars(elapsedMs)) return { error: "That result isn't possible at that speed." };

  if (!timed) {
    // "Finished" has to mean the whole text was covered.
    const textChars = (room.words ?? []).reduce((n, w) => n + w.length, 0);
    const covered = stats.correctChars + stats.incorrectChars + stats.missedChars;
    if (covered < textChars * 0.9) return { error: "That result doesn't cover the whole text." };
  }

  const minutes = Math.max(elapsedMs / 60000, 1 / 600);
  return {
    userId: player.userId,
    username: player.username,
    avatarUrl: player.avatarUrl,
    wpm: Math.min(MAX_WPM, Math.round(stats.correctChars / 5 / minutes)),
    rawWpm: Math.round(typed / 5 / minutes),
    accuracy: typed > 0 ? Math.round((stats.correctChars / typed) * 100) : 0,
    consistency: Math.round(stats.consistency),
    correctChars: stats.correctChars,
    incorrectChars: stats.incorrectChars,
    missedChars: stats.missedChars,
    extraChars: stats.extraChars,
    elapsedMs: Math.round(elapsedMs),
    finished: true,
    forfeit: false,
    graphData: stats.graphData,
    replay: stats.replay,
  };
}

// For someone who never reported a result (closed the tab, forfeited, ran
// out the clock on a fixed-text race): whatever their last progress said.
export function dnfOutcome(room: Room, player: PlayerState, now: number): RaceOutcome {
  const wpm = Math.min(MAX_WPM, Math.max(0, Math.round(player.lastProgress?.wpm ?? 0)));
  const cap = room.settings.format === "time" ? room.settings.seconds * 1000 : MAX_FIXED_RACE_MS;
  const elapsed = Math.max(0, Math.min(now - (room.startsAt ?? now), cap));
  return {
    userId: player.userId,
    username: player.username,
    avatarUrl: player.avatarUrl,
    wpm,
    rawWpm: wpm,
    accuracy: 0,
    consistency: 0,
    correctChars: 0,
    incorrectChars: 0,
    missedChars: 0,
    extraChars: 0,
    elapsedMs: Math.round(elapsed),
    finished: false,
    forfeit: player.forfeit,
    graphData: [],
  };
}

export function decideResults(room: Room, reason: EndReason, now: number): RaceResults {
  const players = [...room.players.values()];
  const outcomes = players.map((p) => p.outcome ?? dnfOutcome(room, p, now));
  const result = (why: "time" | "finish" | "forfeit", winnerId: string | null): RaceResults =>
    winnerId
      ? { winnerId, reason: why, outcomes, words: room.words ?? [] }
      : { winnerId: null, reason: "tie", outcomes, words: room.words ?? [] };

  if (reason === "forfeit") {
    return result("forfeit", players.find((p) => !p.forfeit)?.userId ?? null);
  }

  if (room.settings.format === "time") {
    const ranked = players
      .map((p, i) => ({ id: p.userId, o: outcomes[i] }))
      .sort((a, b) => b.o.wpm - a.o.wpm || b.o.accuracy - a.o.accuracy);
    const [first, second] = ranked;
    if (!first) return result("time", null);
    const tied = second && first.o.wpm === second.o.wpm && first.o.accuracy === second.o.accuracy;
    return result("time", tied ? null : first.id);
  }

  // Fixed text: first across the line, by the server's clock.
  const finishers = players
    .filter((p) => p.outcome !== null && p.finishedAt !== null)
    .sort((a, b) => (a.finishedAt as number) - (b.finishedAt as number));
  if (finishers.length > 0) return result("finish", finishers[0].userId);

  // Nobody finished before the cap: whoever got furthest.
  const reached = players
    .map((p) => ({ id: p.userId, at: p.lastProgress ? positionOf(room, p.lastProgress.word, p.lastProgress.char) : 0 }))
    .sort((a, b) => b.at - a.at);
  const tied = reached.length > 1 && reached[0].at === reached[1].at;
  return result("finish", tied || reached.length === 0 ? null : reached[0].id);
}
