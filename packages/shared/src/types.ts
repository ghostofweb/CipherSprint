import type { z } from "zod";
import type {
  signupSchema,
  loginSchema,
  googleCompleteSchema,
  visibilitySchema,
  presenceSchema,
  avatarUpdateSchema,
  createGroupSchema,
  friendRequestSchema,
  sendMessageSchema,
  mediaSignatureSchema,
  resultSchema,
  raceSettingsSchema,
  raceCreateSchema,
  raceSettingsUpdateSchema,
  raceInviteSchema,
  raceProgressSchema,
  raceFinishSchema,
  settingsSchema,
  reportUserSchema,
} from "./schemas.js";

// Request-body input types, inferred straight from the validation schemas
// so they can never drift from what's actually enforced.
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleCompleteInput = z.infer<typeof googleCompleteSchema>;
export type VisibilityInput = z.infer<typeof visibilitySchema>;
export type PresenceInput = z.infer<typeof presenceSchema>;
export type AvatarUpdateInput = z.infer<typeof avatarUpdateSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type FriendRequestInput = z.infer<typeof friendRequestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MediaSignatureInput = z.infer<typeof mediaSignatureSchema>;
export type ResultInput = z.infer<typeof resultSchema>;
export type RaceSettings = z.infer<typeof raceSettingsSchema>;
export type RaceCreateInput = z.infer<typeof raceCreateSchema>;
export type RaceSettingsUpdateInput = z.infer<typeof raceSettingsUpdateSchema>;
export type RaceInviteInput = z.infer<typeof raceInviteSchema>;
export type RaceProgressInput = z.infer<typeof raceProgressSchema>;
export type RaceFinishInput = z.infer<typeof raceFinishSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Language = Settings["language"];
export type ReportUserInput = z.infer<typeof reportUserSchema>;

// Response/domain shapes -- hand-written since they describe what the
// server returns (DB-generated ids/timestamps included), not what a
// client is allowed to send.

export interface PublicUser {
  id: string;
  username: string;
  publicId: string;
  email: string;
  createdAt: string;
  isPublic: boolean;
  // Whether friends can see when this user is online.
  showPresence: boolean;
  avatarUrl: string | null;
  // False for Google-only accounts (no password to change).
  hasPassword: boolean;
  // Allowed to review reports (ADMIN_USERNAMES on the server).
  isAdmin: boolean;
}

export interface UserAggregates {
  completedTests: number;
  totalTimeTypingSeconds: number;
  bestWpm: number;
  bestAccuracy: number;
  bestConsistency: number;
  avgWpmLast10: number;
  avgAccuracyLast10: number;
  avgConsistencyLast10: number;
  streak: { current: number; max: number };
  testActivity: Record<string, number>;
  charMistakes: Record<string, number>;
}

export interface PersonalBest {
  mode: string;
  modeDetail: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  timestamp: number;
}

export interface LeaderboardRow {
  username: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  avatarUrl: string | null;
}

// The caller's own standing in one leaderboard category.
export interface MyLeaderboardEntry extends LeaderboardRow {
  rank: number;
}

export interface FriendRow {
  userId: string;
  username: string;
  avatarUrl: string | null;
  dmConversationId: string | null;
  lastMessageText: string | null;
  lastMessageSenderUsername: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  online: boolean;
  // The race they are in right now (watchable), if any.
  racingCode?: string | null;
}

export type Relationship = "none" | "friends" | "outgoing" | "incoming" | "self";

// A row from GET /users/search, annotated with how the searcher relates to
// that person so the UI can show the right action (add / requested /
// accept / message).
export interface UserSearchResult {
  username: string;
  publicId: string;
  avatarUrl: string | null;
  relationship: Relationship;
  // Present for "outgoing" (cancel) and "incoming" (accept).
  requestId?: string;
}

export interface FriendRequestRow {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface GroupSummary {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  memberCount: number;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  lastMessageText?: string | null;
  lastMessageSenderUsername?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  // Only set by the directory listing.
  isMember?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMemberRow {
  username: string;
  role: "owner" | "member";
  avatarUrl: string | null;
}

// Socket notification payloads (not REST responses) -- pushed to a user's
// personal `user:<id>` room regardless of what page they're on.
export interface FriendRequestNotification {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendAcceptedNotification {
  username: string;
  avatarUrl: string | null;
}

export interface MessageNotification {
  contextType: "group" | "dm";
  contextId: string;
  preview: string;
  senderUsername: string;
  createdAt: string;
}

// Pushed to a user's friends when they connect / fully disconnect.
export interface PresenceUpdate {
  userId: string;
  online: boolean;
}

// Relayed live while someone is composing a message -- never persisted.
export interface TypingUpdate {
  contextType: "group" | "dm";
  contextId: string;
  username: string;
  isTyping: boolean;
}

export interface ChatMessage {
  _id: string;
  contextType: "group" | "dm";
  contextId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  createdAt: string;
  // Only on the copy echoed back to the sender (see sendMessageSchema).
  clientId?: string;
}

// ---- Races ----
// Socket events (all acked with RaceAck unless noted):
//   client -> server: race:create, race:join, race:leave, race:settings,
//     race:kick, race:invite, race:start, race:progress (no ack), race:finish,
//     race:rematch
//   server -> client: race:state (RaceSnapshot), race:countdown (RaceSnapshot,
//     the moment the text is revealed), race:progress (RaceProgress),
//     race:invited (RaceInvite, to the invitee's user room), race:closed

export type RacePhase = "lobby" | "countdown" | "running" | "finished";

export interface RacePlayer {
  userId: string;
  username: string;
  avatarUrl: string | null;
  // False while a dropped socket is inside its reconnect grace window.
  connected: boolean;
  finished: boolean;
}

export interface RaceOutcome {
  userId: string;
  username: string;
  // Carried here so the results can still show someone who has left the room.
  avatarUrl: string | null;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
  elapsedMs: number;
  // Completed the text (words/quote) or ran the full clock (time).
  finished: boolean;
  forfeit: boolean;
  // [second, overall wpm] -- drives the two-line result chart.
  graphData: [number, number][];
  // Keystrokes for the side-by-side replay (absent for a DNF).
  replay?: [number, string][];
}

export interface RaceResults {
  // null = a tie.
  winnerId: string | null;
  reason: "time" | "finish" | "forfeit" | "tie";
  outcomes: RaceOutcome[];
  // The text that was raced, for replays.
  words: string[];
}

export interface RaceSnapshot {
  code: string;
  phase: RacePhase;
  settings: RaceSettings;
  hostId: string;
  players: RacePlayer[];
  // 1-based; goes up on every rematch so the client can remount cleanly.
  round: number;
  // Server epoch ms at which typing begins (set from countdown onwards).
  startsAt: number | null;
  // Server clock when this snapshot was built: the client derives its offset
  // from it, so the countdown lines up even if the two clocks disagree.
  serverNow: number;
  // The shared text; only present from countdown onwards.
  words: string[] | null;
  // Rounds won this session, by userId.
  series: Record<string, number>;
  // userIds that have asked for a rematch.
  rematch: string[];
  // People watching (not racing).
  spectators: number;
  // Paired by quick match: starts by itself once both players are in.
  quickMatch: boolean;
  results: RaceResults | null;
}

export interface RaceProgress {
  userId: string;
  word: number;
  char: number;
  wpm: number;
}

export interface RaceInvite {
  code: string;
  from: { username: string; avatarUrl: string | null };
  settings: RaceSettings;
}

// The room is gone for you: the host left, you were removed, or it timed out.
export interface RaceClosed {
  code: string;
  reason: "host-left" | "opponent-left" | "kicked" | "expired";
}

// `code` on a failure names the race you are already in, so the UI can offer
// to take you back to it.
// Quick match found an opponent: open this room.
export interface RaceMatched {
  code: string;
  opponent: { username: string; avatarUrl: string | null };
}

export type RaceAck<T extends object = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string; code?: string };

// ---- Profiles: race record ----

export interface RaceRecordEntry {
  code: string;
  endedAt: string;
  format: string;
  detail: string;
  opponent: { username: string; avatarUrl: string | null } | null;
  wpm: number;
  opponentWpm: number | null;
  result: "win" | "loss" | "tie";
}

export interface RaceRecord {
  wins: number;
  losses: number;
  ties: number;
  // Against the person looking (absent on your own profile or signed out).
  headToHead: { wins: number; losses: number; ties: number } | null;
  recent: RaceRecordEntry[];
}

// ---- Results: personal best feedback ----

export interface PersonalBestInfo {
  isNew: boolean;
  // The best before this result (null if this was the first in its category).
  previous: number | null;
}

// ---- Safety ----

export interface BlockedUser {
  username: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface ReportRow {
  id: string;
  reporter: string;
  target: string;
  reason: string;
  note: string;
  context: { kind: string; ref: string | null; excerpt: string | null };
  status: "open" | "resolved";
  createdAt: string;
}
