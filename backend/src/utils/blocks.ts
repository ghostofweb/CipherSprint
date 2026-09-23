import Block from "../models/Block";

// Whether either person has blocked the other.
export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  return Boolean(await Block.exists({ $or: [{ blocker: a, blocked: b }, { blocker: b, blocked: a }] }));
}

// Everyone this user must not see or be seen by (both directions).
export async function hiddenUserIds(userId: string): Promise<string[]> {
  const rows = await Block.find({ $or: [{ blocker: userId }, { blocked: userId }] })
    .select("blocker blocked -_id")
    .lean();
  return rows.map((r) => (String(r.blocker) === userId ? String(r.blocked) : String(r.blocker)));
}
