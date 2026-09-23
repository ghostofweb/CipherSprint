import Group from "../models/Group";
import GroupMember from "../models/GroupMember";
import Message from "../models/Message";
import { destroyAsset } from "./cloudinary";

// Removes someone from a group. An owner hands the group to the member who
// joined earliest; the last member out deletes it (and its messages).
export async function leaveGroup(groupId: string, userId: string): Promise<"left" | "not-member"> {
  const membership = await GroupMember.findOne({ groupId, userId });
  if (!membership) return "not-member";

  await membership.deleteOne();
  await Group.updateOne({ _id: groupId }, { $inc: { memberCount: -1 } });

  if (membership.role === "owner") {
    const nextOwner = await GroupMember.findOne({ groupId }).sort({ joinedAt: 1 });
    if (nextOwner) {
      nextOwner.role = "owner";
      await nextOwner.save();
      await Group.updateOne({ _id: groupId }, { ownerId: nextOwner.userId });
    } else {
      const group = await Group.findByIdAndDelete(groupId);
      await Message.deleteMany({ contextType: "group", contextId: groupId });
      if (group?.avatarPublicId) await destroyAsset(group.avatarPublicId).catch(() => {});
    }
  }
  return "left";
}
