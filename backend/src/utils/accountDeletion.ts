import User from "../models/User";
import Result from "../models/Result";
import PersonalBest from "../models/PersonalBest";
import Friendship from "../models/Friendship";
import GroupMember from "../models/GroupMember";
import ConversationRead from "../models/ConversationRead";
import DirectConversation from "../models/DirectConversation";
import Message from "../models/Message";
import Race from "../models/Race";
import Block from "../models/Block";
import Report from "../models/Report";
import { leaveGroup } from "./groupMembership";
import { destroyAsset } from "./cloudinary";
import { forgetVersion } from "./tokens";

const GONE = "deleted user";

// Removes an account and everything that is only theirs. Shared history
// keeps its shape: their group messages and race rows stay, credited to
// "deleted user", so other people's conversations and records still read.
export async function deleteAccount(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  // Groups first, so ownership moves to someone else (or the group goes).
  const memberships = await GroupMember.find({ userId }).select("groupId").lean();
  for (const m of memberships) await leaveGroup(String(m.groupId), userId);

  // Direct messages are between two people; with one gone they go too.
  const convos = await DirectConversation.find({ $or: [{ participantA: userId }, { participantB: userId }] }).select("_id").lean();
  const convoIds = convos.map((c) => c._id);
  await Message.deleteMany({ contextType: "dm", contextId: { $in: convoIds } });
  await DirectConversation.deleteMany({ _id: { $in: convoIds } });
  await ConversationRead.deleteMany({ $or: [{ userId }, { contextType: "dm", contextId: { $in: convoIds } }] });

  await Message.updateMany({ contextType: "group", senderId: userId }, { senderUsername: GONE });
  await Race.updateMany({ "players.userId": userId }, { $set: { "players.$[p].username": GONE } }, { arrayFilters: [{ "p.userId": user._id }] });

  await Promise.all([
    Result.deleteMany({ userId }),
    PersonalBest.deleteMany({ userId }),
    Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
    Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] }),
    Report.deleteMany({ reporter: userId }),
  ]);

  if (user.avatarPublicId) await destroyAsset(user.avatarPublicId).catch(() => {});
  await user.deleteOne();
  forgetVersion(userId);
}
