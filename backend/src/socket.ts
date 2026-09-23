import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifySession } from "./utils/tokens";
import { sendMessageSchema } from "@ciphersprint/shared";
import User from "./models/User";
import { isGroupMember, isDirectParticipant, getGroupMemberIds } from "./utils/chatAccess";
import DirectConversation from "./models/DirectConversation";
import ConversationRead from "./models/ConversationRead";
import { postMessage } from "./utils/messages";
import { userRoom, friendIdsOf } from "./utils/socketRooms";
import { isBlockedBetween } from "./utils/blocks";
import { registerRaceHandlers } from "./race/handlers";
import type { ChatContextType } from "./models/Message";

interface AuthedSocket extends Socket {
  userId: string;
  username: string;
}

interface RoomRef {
  contextType: ChatContextType;
  contextId: string;
}

type Ack = ((response: { ok: boolean; error?: string; message?: unknown; lastReadAt?: Date | null }) => void) | undefined;

const roomName = ({ contextType, contextId }: RoomRef) => `${contextType}:${contextId}`;
// Every authenticated socket also joins its own personal room (see
// utils/socketRooms), so the server can push a notification (a friend
// request, a new message in a chat you don't currently have open) to a user
// regardless of what page or conversation room they're actually in.

// Re-validates membership server-side before letting a socket join a room
// or post into it -- the client-provided contextType/contextId can't be
// trusted on their own, or any authenticated user could read/write any
// group or DM by guessing an id.
async function canAccess(contextType: ChatContextType, contextId: string, userId: string): Promise<boolean> {
  if (contextType === "group") {
    return isGroupMember(contextId, userId);
  }
  if (contextType === "dm") {
    const convo = await DirectConversation.findById(contextId);
    if (!convo || !isDirectParticipant(convo, userId)) return false;
    // A block closes the conversation both ways.
    return !(await isBlockedBetween(String(convo.participantA), String(convo.participantB)));
  }
  return false;
}

// Every participant/member of a context, for fanning out a new-message
// notification -- the sender is included (excludeSender: false) so their
// own friend/group list preview and timestamp update live too, without a
// separate code path; the client itself decides not to bump its own
// unread badge for a self-sent message.
async function allParticipants(
  contextType: ChatContextType,
  contextId: string,
  senderId: string,
  excludeSender = false
): Promise<string[]> {
  const ids =
    contextType === "group"
      ? await getGroupMemberIds(contextId)
      : await (async () => {
          const convo = await DirectConversation.findById(contextId);
          return convo ? [String(convo.participantA), String(convo.participantB)] : [];
        })();
  return excludeSender ? ids.filter((id) => id !== senderId) : ids;
}

let ioInstance: Server | null = null;

// A retry after a lost ack must not persist the message twice: remember what
// each (user, clientId) already produced for a short window and answer a
// repeat with the same message. In-memory like presence (single process).
const RECENT_SEND_TTL_MS = 2 * 60 * 1000;
const recentSends = new Map<string, { message: unknown; at: number }>();
function rememberSend(key: string, message: unknown) {
  const now = Date.now();
  recentSends.set(key, { message, at: now });
  if (recentSends.size > 5000) {
    for (const [k, v] of recentSends) if (now - v.at > RECENT_SEND_TTL_MS) recentSends.delete(k);
  }
}

// Lets REST route handlers (which don't otherwise have access to the
// socket server) push a live event after a DB write, e.g. a friend
// request notification.
export function getIO(): Server | null {
  return ioInstance;
}

// ---- Presence ----
// In-memory: userId -> live socket ids (a user can have several tabs).
// Correct for a single Node process; running more than one needs the Redis
// adapter's fetchSockets() in place of this map, same as the note below.
const liveSockets = new Map<string, Set<string>>();
// Users their friends currently believe are online (drives grace-period
// logic so a page reload does not flash offline -> online).
const announcedOnline = new Set<string>();
const offlineTimers = new Map<string, NodeJS.Timeout>();
const OFFLINE_GRACE_MS = 5000;

export function isOnline(userId: string): boolean {
  return (liveSockets.get(userId)?.size ?? 0) > 0;
}

async function emitPresence(io: Server, userId: string, online: boolean) {
  for (const friendId of await friendIdsOf(userId)) {
    io.to(userRoom(friendId)).emit("presence:update", { userId, online });
  }
}

// Respects the user's opt-out: someone who hides their status is never announced.
async function announcePresence(io: Server, userId: string, online: boolean) {
  const user = await User.findById(userId).select("showPresence").lean();
  if (user && user.showPresence === false) return;
  await emitPresence(io, userId, online);
}

// Called when the setting changes mid-session: hide immediately, or reveal
// if they are connected right now.
export async function syncPresenceVisibility(userId: string, show: boolean): Promise<void> {
  if (!ioInstance) return;
  if (!show) await emitPresence(ioInstance, userId, false);
  else if (isOnline(userId)) await emitPresence(ioInstance, userId, true);
}

// A single Node process handles this fine. Running more than one instance
// later needs the @socket.io/redis-adapter so a broadcast from one process
// reaches sockets connected to another.
export function attachSocket(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Not authenticated");
      const userId = await verifySession(token);
      if (!userId) throw new Error("Not authenticated");
      const user = await User.findById(userId).select("username").lean();
      if (!user) throw new Error("Not authenticated");
      (socket as AuthedSocket).userId = userId;
      (socket as AuthedSocket).username = user.username;
      next();
    } catch {
      next(new Error("Not authenticated"));
    }
  });

  io.on("connection", (socket) => {
    const authed = socket as AuthedSocket;
    socket.join(userRoom(authed.userId));

    let sockets = liveSockets.get(authed.userId);
    if (!sockets) liveSockets.set(authed.userId, (sockets = new Set()));
    sockets.add(socket.id);
    const pendingOffline = offlineTimers.get(authed.userId);
    if (pendingOffline) {
      clearTimeout(pendingOffline);
      offlineTimers.delete(authed.userId);
    }
    if (!announcedOnline.has(authed.userId)) {
      announcedOnline.add(authed.userId);
      announcePresence(io, authed.userId, true).catch(() => {});
    }

    registerRaceHandlers(io, socket);

    socket.on("disconnect", () => {
      const set = liveSockets.get(authed.userId);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        liveSockets.delete(authed.userId);
        offlineTimers.set(
          authed.userId,
          setTimeout(() => {
            offlineTimers.delete(authed.userId);
            if (isOnline(authed.userId)) return;
            announcedOnline.delete(authed.userId);
            announcePresence(io, authed.userId, false).catch(() => {});
          }, OFFLINE_GRACE_MS)
        );
      }
    });

    socket.on("join:room", async (room: RoomRef, ack: Ack) => {
      const allowed = await canAccess(room.contextType, room.contextId, authed.userId).catch(() => false);
      if (!allowed) return ack?.({ ok: false, error: "Not authorized" });
      socket.join(roomName(room));
      // Opening/viewing a conversation is what marks it read -- no separate
      // event needed. The previous lastReadAt goes back in the ack so the
      // client can draw a "new messages" divider where it left off.
      const previous = await ConversationRead.findOneAndUpdate(
        { userId: authed.userId, contextType: room.contextType, contextId: room.contextId },
        { lastReadAt: new Date() },
        { upsert: true, new: false }
      ).lean();
      ack?.({ ok: true, lastReadAt: previous?.lastReadAt ?? null });
    });

    socket.on("leave:room", ({ contextType, contextId }: RoomRef) => {
      socket.leave(roomName({ contextType, contextId }));
    });

    socket.on("message:send", async (payload: RoomRef & { text: string }, ack: Ack) => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        return ack?.({ ok: false, error: parsed.error.issues[0]?.message || "Invalid message" });
      }
      const { contextType, contextId, text, clientId } = parsed.data;

      const allowed = await canAccess(contextType, contextId, authed.userId).catch(() => false);
      if (!allowed) return ack?.({ ok: false, error: "Not authorized" });

      const sendKey = clientId ? `${authed.userId}:${clientId}` : null;
      const seen = sendKey ? recentSends.get(sendKey) : undefined;
      if (seen && Date.now() - seen.at < RECENT_SEND_TTL_MS) {
        return ack?.({ ok: true, message: seen.message });
      }

      const message = await postMessage({
        contextType,
        contextId,
        senderId: authed.userId,
        senderUsername: authed.username,
        text,
      });

      // clientId rides along (never persisted) so the sender can replace its
      // optimistic copy with this exact message.
      const outgoing = clientId ? { ...message.toObject(), clientId } : message;
      if (sendKey) rememberSend(sendKey, outgoing);
      io.to(roomName({ contextType, contextId })).emit("message:new", outgoing);

      // The sender's own lastReadAt should also move forward (their own
      // message obviously doesn't count as unread for them).
      await ConversationRead.updateOne(
        { userId: authed.userId, contextType, contextId },
        { lastReadAt: message.createdAt },
        { upsert: true }
      );

      // Sent to every participant including the sender -- lets the
      // friends/groups list preview and timestamp update live for
      // whoever sent it too, not just the recipients.
      const participants = await allParticipants(contextType, contextId, authed.userId);
      const preview = text.length > 140 ? `${text.slice(0, 140)}…` : text;
      for (const participantId of participants) {
        io.to(userRoom(participantId)).emit("notification:message", {
          contextType,
          contextId,
          preview,
          senderUsername: authed.username,
          createdAt: message.createdAt,
        });
      }

      // Whoever was composing this message is done -- stop their typing
      // indicator immediately rather than waiting for the client's own
      // idle timeout to expire it.
      socket.to(roomName({ contextType, contextId })).emit("typing:update", {
        contextType,
        contextId,
        username: authed.username,
        isTyping: false,
      });

      ack?.({ ok: true, message: outgoing });
    });

    socket.on("typing:start", async (room: RoomRef) => {
      const allowed = await canAccess(room.contextType, room.contextId, authed.userId).catch(() => false);
      if (!allowed) return;
      socket.to(roomName(room)).emit("typing:update", {
        contextType: room.contextType,
        contextId: room.contextId,
        username: authed.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", async (room: RoomRef) => {
      const allowed = await canAccess(room.contextType, room.contextId, authed.userId).catch(() => false);
      if (!allowed) return;
      socket.to(roomName(room)).emit("typing:update", {
        contextType: room.contextType,
        contextId: room.contextId,
        username: authed.username,
        isTyping: false,
      });
    });
  });

  return io;
}
