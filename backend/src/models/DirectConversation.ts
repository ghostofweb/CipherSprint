import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDirectConversation extends Document {
  participantA: Types.ObjectId;
  participantB: Types.ObjectId;
  lastMessageAt: Date | null;
  lastMessageText: string | null;
  lastMessageSenderUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const directConversationSchema = new Schema<IDirectConversation>(
  {
    // Stored in canonical (string-sorted) order so a pair of users only
    // ever gets one conversation row, regardless of who started it.
    participantA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participantB: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // null until a first message is actually sent -- opening a DM (which
    // creates this row) shouldn't make an empty conversation look like it
    // has recent activity, or sort it above conversations with real
    // messages, in the friends list.
    lastMessageAt: { type: Date, default: null },
    // Denormalized so listing "my conversations" for the friends panel
    // doesn't need a separate query per row just for the preview text.
    lastMessageText: { type: String, default: null },
    lastMessageSenderUsername: { type: String, default: null },
  },
  { timestamps: true }
);

directConversationSchema.index({ participantA: 1, participantB: 1 }, { unique: true });

export default mongoose.model<IDirectConversation>("DirectConversation", directConversationSchema);
