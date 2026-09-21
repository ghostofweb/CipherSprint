// Membership/authorization checks shared between the REST chat routes and
// the socket handlers -- both must apply the exact same rules, or a client
// could read/join a room over one path that the other path would refuse.

import { Types } from "mongoose";
import GroupMember from "../models/GroupMember";
import DirectConversation, { IDirectConversation } from "../models/DirectConversation";
import Friendship from "../models/Friendship";

type IdLike = string | Types.ObjectId;

export async function isGroupMember(groupId: IdLike, userId: IdLike): Promise<boolean> {
  return !!(await GroupMember.exists({ groupId, userId }));
}

// All member userIds for a group -- used to fan out a new-message
// notification to everyone except the sender.
export async function getGroupMemberIds(groupId: IdLike): Promise<string[]> {
  const members = await GroupMember.find({ groupId }).select("userId -_id").lean();
  return members.map((m) => String(m.userId));
}

// Canonical (string-sorted) order so a pair of users only ever maps to one
// DirectConversation row, regardless of who looks it up first.
export function canonicalPair(idA: IdLike, idB: IdLike): [string, string] {
  const pair = [String(idA), String(idB)].sort();
  return [pair[0], pair[1]];
}

export async function areFriends(idA: IdLike, idB: IdLike): Promise<boolean> {
  return !!(await Friendship.exists({
    status: "accepted",
    $or: [
      { requester: idA, recipient: idB },
      { requester: idB, recipient: idA },
    ],
  }));
}

export async function getOrCreateDirectConversation(idA: IdLike, idB: IdLike): Promise<IDirectConversation> {
  const [participantA, participantB] = canonicalPair(idA, idB);
  let convo = await DirectConversation.findOne({ participantA, participantB });
  if (!convo) {
    convo = await DirectConversation.create({ participantA, participantB });
  }
  return convo;
}

export function isDirectParticipant(convo: IDirectConversation, userId: IdLike): boolean {
  return String(convo.participantA) === String(userId) || String(convo.participantB) === String(userId);
}
