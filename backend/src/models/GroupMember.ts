import mongoose, { Schema, Document, Types } from "mongoose";

export type GroupRole = "owner" | "member";

export interface IGroupMember extends Document {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  role: GroupRole;
  joinedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Membership rows instead of an array on Group, so member counts don't
// force a rewrite of a growing document as groups scale.
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ userId: 1 });

export default mongoose.model<IGroupMember>("GroupMember", groupMemberSchema);
