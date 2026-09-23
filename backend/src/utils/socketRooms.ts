import Friendship from "../models/Friendship";

// Every authenticated socket also joins its own personal room, so the
// server can push something to a user regardless of what page or
// conversation they are in. Shared here (rather than living in socket.ts) so
// feature modules can use it without importing the socket server itself.
export const userRoom = (userId: string) => `user:${userId}`;

export async function friendIdsOf(userId: string): Promise<string[]> {
  const rows = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .select("requester recipient -_id")
    .lean();
  return rows.map((r) => (String(r.requester) === userId ? String(r.recipient) : String(r.requester)));
}
