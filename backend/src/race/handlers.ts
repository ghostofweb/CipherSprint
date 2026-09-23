import type { Server, Socket } from "socket.io";
import {
  raceCreateSchema,
  raceRoomSchema,
  raceSettingsUpdateSchema,
  raceInviteSchema,
  raceProgressSchema,
  raceFinishSchema,
} from "@ciphersprint/shared";
import { DEFAULT_RACE_SETTINGS, QUICK_MATCH_PRESETS, quickMatchSchema } from "@ciphersprint/shared";
import type { RaceAck, RaceClosed, RaceInvite, RaceMatched, RaceProgress, RaceSettings } from "@ciphersprint/shared";
import { isBlockedBetween } from "../utils/blocks";
import User from "../models/User";
import RaceModel from "../models/Race";
import { userRoom, friendIdsOf } from "../utils/socketRooms";
import * as store from "./store";
import { buildRaceText } from "./words";
import { buildOutcome, decideResults, isPlausibleProgress } from "./results";
import type { EndReason } from "./results";

interface AuthedSocket extends Socket {
  userId: string;
  username: string;
}

type Room = store.Room;
type Ack = ((res: RaceAck<any>) => void) | undefined;

const channel = (code: string) => `race:${code}`;
const reply = (ack: Ack, res: RaceAck<any>) => {
  if (typeof ack === "function") ack(res);
};
const fail = (ack: Ack, error: string, code?: string) => reply(ack, code ? { ok: false, error, code } : { ok: false, error });
const firstIssue = (err: { issues: { message: string }[] }) => err.issues[0]?.message ?? "Invalid request";

// A handler that throws must not take the process down (an unhandled
// rejection from an async socket listener does), and the caller should hear
// about it instead of hanging on an ack that never comes.
function guard<A extends unknown[]>(fn: (...args: A) => Promise<void> | void) {
  return async (...args: A) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error("[race]", err);
      const last = args[args.length - 1];
      if (typeof last === "function") (last as (res: RaceAck<any>) => void)({ ok: false, error: "Something went wrong. Try again." });
    }
  };
}

function broadcast(io: Server, room: Room) {
  room.touchedAt = Date.now();
  io.to(channel(room.code)).emit("race:state", store.snapshot(room));
}

function detach(io: Server, room: Room, userId: string) {
  io.in(userRoom(userId)).socketsLeave(channel(room.code));
}

function closeRoom(io: Server, room: Room, reason: RaceClosed["reason"]) {
  const payload: RaceClosed = { code: room.code, reason };
  io.to(channel(room.code)).emit("race:closed", payload);
  io.in(channel(room.code)).socketsLeave(channel(room.code));
  store.destroyRoom(room);
}

function everyoneConnected(room: Room): boolean {
  return [...room.players.values()].every((p) => p.sockets.size > 0);
}

// ---- Round lifecycle: lobby -> countdown -> running -> finished ----

function beginCountdown(io: Server, room: Room) {
  store.clearTimers(room);
  store.setText(room, buildRaceText(room.settings));
  room.phase = "countdown";
  room.results = null;
  room.rematch.clear();
  for (const p of room.players.values()) {
    p.lastProgress = null;
    p.finishedAt = null;
    p.outcome = null;
    p.forfeit = false;
    p.left = false;
  }
  room.startsAt = Date.now() + store.COUNTDOWN_MS;
  room.startedAtWall = null;
  room.touchedAt = Date.now();
  room.timers.go = setTimeout(() => startRunning(io, room), store.COUNTDOWN_MS);
  io.to(channel(room.code)).emit("race:countdown", store.snapshot(room));
}

function startRunning(io: Server, room: Room) {
  room.timers.go = null;
  if (room.phase !== "countdown") return;
  room.phase = "running";
  room.startedAtWall = Date.now();
  const timed = room.settings.format === "time";
  const cap = timed ? room.settings.seconds * 1000 + store.TIME_GRACE_MS : store.MAX_FIXED_RACE_MS;
  room.timers.end = setTimeout(() => finalize(io, room, timed ? "time" : "cap"), cap);
  broadcast(io, room);
  announceRacing(io, room, true);
}

// Friends of a racer see "racing now" with a Watch link while it lasts.
function announceRacing(io: Server, room: Room, racing: boolean) {
  for (const p of room.players.values()) {
    const payload = { userId: p.userId, code: racing ? room.code : null };
    friendIdsOf(p.userId)
      .then((ids) => ids.forEach((id) => io.to(userRoom(id)).emit("friend:racing", payload)))
      .catch(() => {});
  }
}

// The race a user is in right now (for the friends list), if any.
export function racingCodeOf(userId: string): string | null {
  const room = store.roomForUser(userId);
  return room && (room.phase === "countdown" || room.phase === "running") ? room.code : null;
}

function persist(room: Room, now: number) {
  const results = room.results;
  if (!results) return;
  RaceModel.create({
    code: room.code,
    round: room.round,
    settings: room.settings,
    players: results.outcomes.map((o) => ({
      userId: o.userId,
      username: o.username,
      wpm: o.wpm,
      rawWpm: o.rawWpm,
      accuracy: o.accuracy,
      consistency: o.consistency,
      elapsedMs: o.elapsedMs,
      finished: o.finished,
      forfeit: o.forfeit,
    })),
    winnerId: results.winnerId,
    reason: results.reason,
    startedAt: room.startedAtWall ? new Date(room.startedAtWall) : null,
    endedAt: new Date(now),
  }).catch((err) => console.error("[race] could not save the result", err));
}

function finalize(io: Server, room: Room, reason: EndReason) {
  if (room.phase === "finished") return;
  const now = Date.now();
  store.clearTimers(room);
  if (room.phase === "running") announceRacing(io, room, false);
  const results = decideResults(room, reason, now);
  room.results = results;
  room.phase = "finished";
  room.rematch.clear();
  if (results.winnerId) room.series[results.winnerId] = (room.series[results.winnerId] ?? 0) + 1;

  persist(room, now);
  // Anyone who left mid-race was only kept so the results could name them
  // (the results carry their name and avatar). Drop them before announcing,
  // so the roster the survivor sees is the room as it really is.
  for (const p of [...room.players.values()]) if (p.left) store.removePlayer(room, p.userId);
  if (room.players.size === 0) return store.destroyRoom(room);
  if (!room.players.has(room.hostId)) room.hostId = room.players.keys().next().value as string;
  broadcast(io, room);
}

// After a result comes in: end the race if nobody is still typing, else (for
// a fixed text) give the others a bounded window to cross the line.
function settle(io: Server, room: Room) {
  const pending = [...room.players.values()].some((p) => p.outcome === null && !p.left);
  if (!pending) return finalize(io, room, room.settings.format === "time" ? "time" : "finish");
  if (room.settings.format !== "time" && !room.timers.grace) {
    room.timers.grace = setTimeout(() => finalize(io, room, "finish"), store.FINISH_GRACE_MS);
  }
  broadcast(io, room);
}

function resetToLobby(room: Room) {
  store.clearTimers(room);
  room.phase = "lobby";
  room.words = null;
  room.startsAt = null;
  room.results = null;
  room.rematch.clear();
  for (const p of room.players.values()) {
    p.lastProgress = null;
    p.finishedAt = null;
    p.outcome = null;
    p.forfeit = false;
    p.left = false;
  }
}

// Removes one player from the room the way their situation calls for.
function leave(io: Server, room: Room, userId: string) {
  const player = room.players.get(userId);
  if (!player) return;
  const isHost = room.hostId === userId;

  if (room.phase === "lobby" || room.phase === "countdown") {
    store.removePlayer(room, userId);
    detach(io, room, userId);
    // No host, no room. Otherwise the seat frees up and the room waits again.
    if (isHost) return closeRoom(io, room, "host-left");
    // A quick match is for exactly these two people.
    if (room.quickMatch) return closeRoom(io, room, "opponent-left");
    if (room.phase === "countdown") resetToLobby(room);
    return broadcast(io, room);
  }

  if (room.phase === "running") {
    player.left = true;
    store.releaseUser(room, userId);
    detach(io, room, userId);
    if (player.outcome === null) {
      player.forfeit = true;
      return finalize(io, room, "forfeit");
    }
    return settle(io, room);
  }

  // finished
  store.removePlayer(room, userId);
  detach(io, room, userId);
  if (room.players.size === 0) return store.destroyRoom(room);
  if (isHost) room.hostId = room.players.keys().next().value as string;
  room.rematch.clear();
  broadcast(io, room);
}

// One race at a time. Someone mid-race elsewhere is told where; an idle
// lobby or results screen is quietly left.
function checkFree(io: Server, userId: string, wantCode?: string): { error: string; code: string } | null {
  const existing = store.roomForUser(userId);
  if (!existing || existing.code === wantCode) return null;
  if (existing.phase === "countdown" || existing.phase === "running") {
    return { error: "You're already in a race that's under way.", code: existing.code };
  }
  leave(io, existing, userId);
  return null;
}

function attach(socket: AuthedSocket, room: Room, player: store.PlayerState) {
  socket.join(channel(room.code));
  player.sockets.add(socket.id);
  player.left = false;
  store.addPlayer(room, player);
  if (player.dropTimer) {
    clearTimeout(player.dropTimer);
    player.dropTimer = null;
  }
}

async function sendInvite(
  io: Server,
  room: Room,
  from: AuthedSocket,
  username: string
): Promise<{ ok: boolean; error?: string }> {
  if (room.hostId !== from.userId) return { ok: false, error: "Only the host can invite." };
  if (room.phase !== "lobby") return { ok: false, error: "The race has already started." };
  if (room.players.size >= store.MAX_PLAYERS) return { ok: false, error: "The race is full." };

  const target = await User.findOne({ usernameLower: username.toLowerCase() }).select("username").lean();
  if (!target) return { ok: false, error: "No one has that username." };
  const targetId = String(target._id);
  if (targetId === from.userId) return { ok: false, error: "You can't invite yourself." };
  if (await isBlockedBetween(from.userId, targetId)) return { ok: false, error: "You can't invite this person." };
  if (!(await friendIdsOf(from.userId)).includes(targetId)) {
    return { ok: false, error: `${target.username} isn't your friend yet.` };
  }
  const last = room.invitedAt.get(targetId);
  if (last && Date.now() - last < 10_000) return { ok: false, error: `${target.username} was just invited.` };
  if ((await io.in(userRoom(targetId)).fetchSockets()).length === 0) {
    return { ok: false, error: `${target.username} is offline.` };
  }

  room.invitedAt.set(targetId, Date.now());
  const host = room.players.get(from.userId);
  const invite: RaceInvite = {
    code: room.code,
    from: { username: from.username, avatarUrl: host?.avatarUrl ?? null },
    settings: room.settings,
  };
  io.to(userRoom(targetId)).emit("race:invited", invite);
  return { ok: true };
}

// ---- Spectators ----

// socket id -> room code it is watching, for clean-up on disconnect.
const watching = new Map<string, string>();

function watch(socket: AuthedSocket, room: Room) {
  socket.join(channel(room.code));
  let set = room.spectators.get(socket.userId);
  if (!set) room.spectators.set(socket.userId, (set = new Set()));
  set.add(socket.id);
  watching.set(socket.id, room.code);
}

function unwatch(io: Server, room: Room, userId: string, socketId?: string) {
  const set = room.spectators.get(userId);
  if (!set) return;
  for (const id of socketId ? [socketId] : [...set]) {
    set.delete(id);
    watching.delete(id);
    io.sockets.sockets.get(id)?.leave(channel(room.code));
  }
  if (set.size === 0) room.spectators.delete(userId);
}

// ---- Quick match ----

const PRESETS: Record<(typeof QUICK_MATCH_PRESETS)[number], RaceSettings> = {
  time30: { ...DEFAULT_RACE_SETTINGS, format: "time", seconds: 30 },
  words30: { ...DEFAULT_RACE_SETTINGS, format: "words", words: 30 },
  quote: { ...DEFAULT_RACE_SETTINGS, format: "quote", quoteLength: "medium" },
};

// How long a matched pair has to open the room before it is called off.
const MATCH_JOIN_MS = 20_000;
// A beat to see who you were paired with before the countdown.
const MATCH_START_DELAY_MS = 1500;

interface QueueEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  socketId: string;
  at: number;
}

const queues = new Map<string, QueueEntry[]>();

function dequeue(userId: string) {
  for (const [preset, list] of queues) {
    const rest = list.filter((e) => e.userId !== userId);
    if (rest.length) queues.set(preset, rest);
    else queues.delete(preset);
  }
}

// A quick-match room starts by itself once both players have it open.
function maybeAutostart(io: Server, room: Room) {
  if (!room.quickMatch || room.phase !== "lobby" || room.players.size < store.MAX_PLAYERS || !everyoneConnected(room)) return;
  if (room.timers.autostart) clearTimeout(room.timers.autostart);
  room.timers.autostart = setTimeout(() => {
    room.timers.autostart = null;
    if (room.phase === "lobby" && room.players.size === store.MAX_PLAYERS && everyoneConnected(room)) beginCountdown(io, room);
  }, MATCH_START_DELAY_MS);
}

let sweeperStarted = false;

export function registerRaceHandlers(io: Server, socket: Socket) {
  const authed = socket as AuthedSocket;

  if (!sweeperStarted) {
    sweeperStarted = true;
    setInterval(() => {
      for (const room of store.takeExpiredRooms(Date.now())) closeRoom(io, room, "expired");
    }, 60_000).unref();
  }

  const profileOf = async () => {
    const profile = await User.findById(authed.userId).select("avatarUrl").lean();
    return store.newPlayer({ userId: authed.userId, username: authed.username, avatarUrl: profile?.avatarUrl ?? null });
  };

  socket.on(
    "race:create",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceCreateSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const blocked = checkFree(io, authed.userId);
      if (blocked) return fail(ack, blocked.error, blocked.code);
      // Hosting a race takes you out of the quick-match queue.
      dequeue(authed.userId);

      const host = await profileOf();
      const room = store.createRoom(host, parsed.data.settings);
      attach(authed, room, host);
      const invite = parsed.data.invite ? await sendInvite(io, room, authed, parsed.data.invite) : undefined;
      reply(ack, { ok: true, code: room.code, snapshot: store.snapshot(room), invite });
    })
  );

  socket.on(
    "race:join",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceRoomSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room) return fail(ack, "That race doesn't exist any more.");

      let player = room.players.get(authed.userId);
      if (!player) {
        for (const p of room.players.values()) {
          if (await isBlockedBetween(authed.userId, p.userId)) return fail(ack, "You can't join this race.");
        }
        // A seat is free in the lobby: take it. Otherwise watch.
        const seatFree = room.phase === "lobby" && room.players.size < store.MAX_PLAYERS && !room.quickMatch;
        if (!seatFree) {
          watch(authed, room);
          broadcast(io, room);
          return reply(ack, { ok: true, snapshot: store.snapshot(room), spectator: true });
        }
        const blocked = checkFree(io, authed.userId, room.code);
        if (blocked) return fail(ack, blocked.error, blocked.code);
        player = await profileOf();
        // Someone may have taken the seat while the profile loaded.
        if (room.players.size >= store.MAX_PLAYERS) {
          watch(authed, room);
          broadcast(io, room);
          return reply(ack, { ok: true, snapshot: store.snapshot(room), spectator: true });
        }
      }
      attach(authed, room, player);
      broadcast(io, room);
      reply(ack, { ok: true, snapshot: store.snapshot(room) });
      maybeAutostart(io, room);
    })
  );

  socket.on(
    "race:leave",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceRoomSchema.safeParse(payload);
      const room = parsed.success ? store.getRoom(parsed.data.code) : undefined;
      if (room && room.spectators.has(authed.userId)) {
        unwatch(io, room, authed.userId);
        broadcast(io, room);
      } else if (room) {
        leave(io, room, authed.userId);
      }
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:settings",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceSettingsUpdateSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room || !room.players.has(authed.userId)) return fail(ack, "That race doesn't exist any more.");
      if (room.hostId !== authed.userId) return fail(ack, "Only the host can change the settings.");
      if (room.phase !== "lobby") return fail(ack, "Settings are locked once the race starts.");
      if (room.quickMatch) return fail(ack, "Quick match rules are fixed.");
      room.settings = parsed.data.settings;
      broadcast(io, room);
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:kick",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceRoomSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room || !room.players.has(authed.userId)) return fail(ack, "That race doesn't exist any more.");
      if (room.hostId !== authed.userId) return fail(ack, "Only the host can remove a player.");
      if (room.phase !== "lobby") return fail(ack, "Players can only be removed in the lobby.");
      const target = [...room.players.values()].find((p) => p.userId !== room.hostId);
      if (!target) return fail(ack, "There's no one to remove.");

      const payloadClosed: RaceClosed = { code: room.code, reason: "kicked" };
      io.to(userRoom(target.userId)).emit("race:closed", payloadClosed);
      store.removePlayer(room, target.userId);
      detach(io, room, target.userId);
      broadcast(io, room);
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:invite",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceInviteSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room || !room.players.has(authed.userId)) return fail(ack, "That race doesn't exist any more.");
      const result = await sendInvite(io, room, authed, parsed.data.username);
      if (!result.ok) return fail(ack, result.error ?? "Couldn't send the invite.");
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:start",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceRoomSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room || !room.players.has(authed.userId)) return fail(ack, "That race doesn't exist any more.");
      if (room.hostId !== authed.userId) return fail(ack, "Only the host can start the race.");
      if (room.phase !== "lobby") return fail(ack, "The race has already started.");
      if (room.players.size < store.MAX_PLAYERS) return fail(ack, "Wait for an opponent to join.");
      if (!everyoneConnected(room)) return fail(ack, "Your opponent is reconnecting. Try again in a moment.");
      beginCountdown(io, room);
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:progress",
    guard(async (payload: unknown) => {
      const parsed = raceProgressSchema.safeParse(payload);
      if (!parsed.success) return;
      const { code, word, char, wpm } = parsed.data;
      const room = store.getRoom(code);
      const player = room?.players.get(authed.userId);
      if (!room || !player || room.phase !== "running" || room.startsAt === null || player.outcome) return;
      const now = Date.now();
      if (now < room.startsAt) return;
      // At most ~25 updates a second per player.
      if (player.lastProgress && now - player.lastProgress.at < 40) return;
      if (!isPlausibleProgress(room, word, char, now)) return;

      player.lastProgress = { word, char, wpm, at: now };
      const update: RaceProgress = { userId: authed.userId, word, char, wpm };
      // Volatile: a stale caret position is worthless, so drop it under
      // backpressure instead of queueing it.
      socket.to(channel(code)).volatile.emit("race:progress", update);
    })
  );

  socket.on(
    "race:finish",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceFinishSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      const player = room?.players.get(authed.userId);
      if (!room || !player) return fail(ack, "That race doesn't exist any more.");
      if (player.outcome) return reply(ack, { ok: true });
      if (room.phase !== "running") return fail(ack, "The race isn't running.");

      const now = Date.now();
      const outcome = buildOutcome(room, player, parsed.data.stats, now);
      if ("error" in outcome) return fail(ack, outcome.error);
      player.outcome = outcome;
      player.finishedAt = now;
      reply(ack, { ok: true });
      settle(io, room);
    })
  );

  socket.on(
    "race:rematch",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = raceRoomSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const room = store.getRoom(parsed.data.code);
      if (!room || !room.players.has(authed.userId)) return fail(ack, "That race doesn't exist any more.");
      if (room.phase !== "finished") return fail(ack, "The race isn't over yet.");

      // The opponent already left: go back to a lobby that waits for someone new.
      if (room.players.size < store.MAX_PLAYERS) {
        room.round += 1;
        // From here it is an ordinary room that anyone with the code can join.
        room.quickMatch = false;
        resetToLobby(room);
        broadcast(io, room);
        return reply(ack, { ok: true });
      }

      if (room.rematch.has(authed.userId)) room.rematch.delete(authed.userId);
      else room.rematch.add(authed.userId);

      if (room.rematch.size >= room.players.size) {
        if (!everyoneConnected(room)) {
          room.rematch.delete(authed.userId);
          return fail(ack, "Your opponent is reconnecting. Try again in a moment.");
        }
        room.round += 1;
        beginCountdown(io, room);
      } else {
        broadcast(io, room);
      }
      reply(ack, { ok: true });
    })
  );

  socket.on(
    "race:queue",
    guard(async (payload: unknown, ack: Ack) => {
      const parsed = quickMatchSchema.safeParse(payload);
      if (!parsed.success) return fail(ack, firstIssue(parsed.error));
      const blocked = checkFree(io, authed.userId);
      if (blocked) return fail(ack, blocked.error, blocked.code);
      dequeue(authed.userId);

      const { preset } = parsed.data;
      const list = queues.get(preset) ?? [];
      let partner: QueueEntry | undefined;
      for (const entry of list) {
        if (entry.userId === authed.userId) continue;
        if (!io.sockets.sockets.get(entry.socketId)) continue;
        if (await isBlockedBetween(authed.userId, entry.userId)) continue;
        partner = entry;
        break;
      }

      if (!partner) {
        const me = await profileOf();
        queues.set(preset, [...list.filter((e) => io.sockets.sockets.get(e.socketId)), { userId: me.userId, username: me.username, avatarUrl: me.avatarUrl, socketId: socket.id, at: Date.now() }]);
        return reply(ack, { ok: true, queued: true });
      }

      // Paired: the one who waited longest hosts.
      dequeue(partner.userId);
      const me = await profileOf();
      const host = store.newPlayer({ userId: partner.userId, username: partner.username, avatarUrl: partner.avatarUrl });
      const room = store.createRoom(host, PRESETS[preset]);
      room.quickMatch = true;
      store.addPlayer(room, me);
      room.timers.autostart = setTimeout(() => {
        room.timers.autostart = null;
        if (room.phase === "lobby" && !everyoneConnected(room)) closeRoom(io, room, "expired");
      }, MATCH_JOIN_MS);

      const matchedFor = (opponent: { username: string; avatarUrl: string | null }): RaceMatched => ({ code: room.code, opponent });
      io.to(partner.socketId).emit("race:matched", matchedFor({ username: me.username, avatarUrl: me.avatarUrl }));
      reply(ack, { ok: true, matched: matchedFor({ username: partner.username, avatarUrl: partner.avatarUrl }) });
    })
  );

  socket.on(
    "race:queue:cancel",
    guard(async (_payload: unknown, ack: Ack) => {
      dequeue(authed.userId);
      reply(ack, { ok: true });
    })
  );

  // A dropped connection keeps its seat for a short while, so a reload or a
  // wifi blip doesn't end the race.
  socket.on("disconnect", () => {
    const watched = watching.get(socket.id);
    const watchedRoom = watched ? store.getRoom(watched) : undefined;
    if (watchedRoom) {
      unwatch(io, watchedRoom, authed.userId, socket.id);
      broadcast(io, watchedRoom);
    } else if (watched) {
      watching.delete(socket.id);
    }
    for (const [preset, list] of queues) {
      const rest = list.filter((e) => e.socketId !== socket.id);
      if (rest.length) queues.set(preset, rest);
      else queues.delete(preset);
    }

    const room = store.roomForUser(authed.userId);
    const player = room?.players.get(authed.userId);
    if (!room || !player) return;
    player.sockets.delete(socket.id);
    if (player.sockets.size > 0) return;

    broadcast(io, room);
    if (player.dropTimer) clearTimeout(player.dropTimer);
    player.dropTimer = setTimeout(() => {
      player.dropTimer = null;
      if (player.sockets.size === 0 && room.players.get(player.userId) === player) leave(io, room, player.userId);
    }, store.RECONNECT_GRACE_MS);
  });
}
