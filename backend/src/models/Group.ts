import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGroup extends Document {
  name: string;
  nameLower: string;
  description: string;
  ownerId: Types.ObjectId;
  memberCount: number;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  lastMessageAt: Date | null;
  lastMessageText: string | null;
  lastMessageSenderUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // Lowercased shadow of name: index-backed prefix search and
    // case-insensitive uniqueness ("Chooms" vs "CHOOMS"). Backfilled for
    // older rows by utils/migrations.ts, hence sparse.
    nameLower: { type: String, unique: true, sparse: true },
    description: { type: String, default: "" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberCount: { type: Number, default: 1 },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    // Denormalized (same reasoning as DirectConversation.lastMessageText)
    // so the friends panel's "my groups" list doesn't need a per-row query.
    lastMessageAt: { type: Date, default: null },
    lastMessageText: { type: String, default: null },
    lastMessageSenderUsername: { type: String, default: null },
  },
  { timestamps: true }
);

// Directory: prefix search by nameLower, and the default "most members" sort.
groupSchema.index({ memberCount: -1, createdAt: -1 });

export default mongoose.model<IGroup>("Group", groupSchema);
