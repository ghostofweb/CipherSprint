import { randomInt } from "crypto";
import { RACE_CODE_ALPHABET } from "@ciphersprint/shared";
import type { RaceOutcome, RacePhase, RaceResults, RaceSettings, RaceSnapshot } from "@ciphersprint/shared";

// Rooms live in memory: a race is a few minutes of state that nobody needs
// after a restart. Correct for a single Node process only (same caveat as
// presence in socket.ts); scaling out needs the Redis adapter plus a shared
// store.

export const MAX_PLAYERS = 2;
// Between the host pressing Start and the first key counting. The clients
// show 3-2-1 for the last three seconds; the extra half second absorbs the
// time the countdown message takes to arrive.
export const COUNTDOWN_MS = 3500;
// After the clock runs out, how long the last `race:finish` packets may take.
export const TIME_GRACE_MS = 2500;
// Words/quote races: how long the loser gets after the winner crosses the line.
export const FINISH_GRACE_MS = 10_000;
// Hard stop for fixed-text races so an abandoned tab can't hold a room open.
export const MAX_FIXED_RACE_MS = 6 * 60_000;
// A dropped connection (reload, wifi blip) can come back this quickly
// without losing its seat.
export const RECONNECT_GRACE_MS = 15_000;
const LOBBY_TTL_MS = 15 * 60_000;
const FINISHED_TTL_MS = 10 * 60_000;

type Timer = ReturnType<typeof setTimeout>;

export interface PlayerState {
  userId: string;
  username: string;
  avatarUrl: string | null;
  // A user can have the room open in more than one tab.
  sockets: Set<string>;
  dropTimer: Timer | null;
  lastProgress: { word: number; char: number; wpm: number; at: number } | null;
  finishedAt: number | null;
  outcome: RaceOutcome | null;
  forfeit: boolean;
  // Left mid-race after finishing: kept only so the results can name them.
  left: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  settings: RaceSettings;
  phase: RacePhase;
  round: number;
  // Insertion order is seat order.
  players: Map<string, PlayerState>;
  words: string[] | null;
  // offsets[i] = characters before word i (spaces included), so a caret
  // position (word, char) becomes one comparable number.
  offsets: number[];
  textLength: number;
  startsAt: number | null;
  series: Record<string, number>;
  rematch: Set<string>;
  results: RaceResults | null;
  invitedAt: Map<string, number>;
  timers: { go: Timer | null; end: Timer | null; grace: Timer | null; autostart: Timer | null };
  touchedAt: number;
  startedAtWall: number | null;
  // userId -> socket ids of people watching (not racing).
  spectators: Map<string, Set<string>>;
  // Paired by quick match: the countdown starts once both players are in.
  quickMatch: boolean;
}

const rooms = new Map<string, Room>();
const roomOfUser = new Map<string, string>();

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function roomForUser(userId: string): Room | undefined {
  const code = roomOfUser.get(userId);
  return code ? rooms.get(code) : undefined;
}

function newCode(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += RACE_CODE_ALPHABET[randomInt(RACE_CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error("Could not allocate a race code");
}

export function newPlayer(p: { userId: string; username: string; avatarUrl: string | null }): PlayerState {
  return {
    ...p,
    sockets: new Set(),
    dropTimer: null,
    lastProgress: null,
    finishedAt: null,
    outcome: null,
    forfeit: false,
    left: false,
  };
}

export function createRoom(host: PlayerState, settings: RaceSettings): Room {
  const room: Room = {
    code: newCode(),
    hostId: host.userId,
    settings,
    phase: "lobby",
    round: 1,
    players: new Map([[host.userId, host]]),
    words: null,
    offsets: [],
    textLength: 0,
    startsAt: null,
    series: {},
    rematch: new Set(),
    results: null,
    invitedAt: new Map(),
    timers: { go: null, end: null, grace: null, autostart: null },
    touchedAt: Date.now(),
    startedAtWall: null,
    spectators: new Map(),
    quickMatch: false,
  };
  rooms.set(room.code, room);
  roomOfUser.set(host.userId, room.code);
  return room;
}

export function addPlayer(room: Room, player: PlayerState): void {
  room.players.set(player.userId, player);
  roomOfUser.set(player.userId, room.code);
}

// Takes someone out of the room's records and their "I'm in a race" pointer.
export function removePlayer(room: Room, userId: string): void {
  const player = room.players.get(userId);
  if (player?.dropTimer) clearTimeout(player.dropTimer);
  room.players.delete(userId);
  room.rematch.delete(userId);
  if (roomOfUser.get(userId) === room.code) roomOfUser.delete(userId);
}

// Forget the "I'm in a race" pointer without touching the room's records.
export function releaseUser(room: Room, userId: string): void {
  if (roomOfUser.get(userId) === room.code) roomOfUser.delete(userId);
}

export function clearTimers(room: Room): void {
  for (const key of ["go", "end", "grace", "autostart"] as const) {
    const timer = room.timers[key];
    if (timer) clearTimeout(timer);
    room.timers[key] = null;
  }
}

export function destroyRoom(room: Room): void {
  clearTimers(room);
  for (const player of room.players.values()) {
    if (player.dropTimer) clearTimeout(player.dropTimer);
    if (roomOfUser.get(player.userId) === room.code) roomOfUser.delete(player.userId);
  }
  rooms.delete(room.code);
}

// Idle lobbies and old results screens are dropped; the caller announces it.
export function takeExpiredRooms(now: number): Room[] {
  const expired: Room[] = [];
  for (const room of rooms.values()) {
    const idle = now - room.touchedAt;
    if ((room.phase === "lobby" && idle > LOBBY_TTL_MS) || (room.phase === "finished" && idle > FINISHED_TTL_MS)) {
      expired.push(room);
    }
  }
  return expired;
}

export function setText(room: Room, words: string[]): void {
  room.words = words;
  room.offsets = [];
  let running = 0;
  for (const word of words) {
    room.offsets.push(running);
    running += word.length + 1;
  }
  room.textLength = Math.max(0, running - 1);
}

export function snapshot(room: Room): RaceSnapshot {
  const revealed = room.phase === "countdown" || room.phase === "running";
  return {
    code: room.code,
    phase: room.phase,
    settings: room.settings,
    hostId: room.hostId,
    players: [...room.players.values()].map((p) => ({
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      connected: p.sockets.size > 0 && !p.left,
      finished: p.outcome !== null,
    })),
    round: room.round,
    startsAt: room.startsAt,
    serverNow: Date.now(),
    words: revealed ? room.words : null,
    series: { ...room.series },
    rematch: [...room.rematch],
    results: room.results,
    spectators: room.spectators.size,
    quickMatch: room.quickMatch,
  };
}
