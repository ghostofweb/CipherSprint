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
