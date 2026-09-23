import jwt from "jsonwebtoken";
import User from "../models/User";

// Session tokens carry the user's tokenVersion ("tv"). Changing or resetting
// a password bumps it, which signs out every other device at once. Tokens
// from before this existed have no tv and count as version 0.

interface SessionPayload {
  userId: string;
  tv?: number;
}

export function signToken(userId: unknown, tokenVersion = 0): string {
  return jwt.sign({ userId: String(userId), tv: tokenVersion }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

// A short cache so every authenticated request does not hit the database.
const CACHE_MS = 5000;
const versions = new Map<string, { tv: number | null; at: number }>();

async function currentVersion(userId: string): Promise<number | null> {
  const hit = versions.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.tv;
  const user = await User.findById(userId).select("tokenVersion").lean();
  const tv = user ? user.tokenVersion ?? 0 : null;
  versions.set(userId, { tv, at: Date.now() });
  if (versions.size > 10000) versions.clear();
  return tv;
}

// Call after changing a user's tokenVersion or deleting them.
export function forgetVersion(userId: string) {
  versions.delete(userId);
}

// The userId for a valid, current session token; null otherwise.
export async function verifySession(token: string): Promise<string | null> {
  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
  if (!payload?.userId) return null;
  const tv = await currentVersion(String(payload.userId));
  if (tv === null || (payload.tv ?? 0) !== tv) return null;
  return String(payload.userId);
}
