import mongoose, { Schema, Document, Types } from "mongoose";
import type { ChatContextType } from "./Message";

export interface IConversationRead extends Document {
  userId: Types.ObjectId;
  contextType: ChatContextType;
  contextId: Types.ObjectId;
  lastReadAt: Date;
}

const conversationReadSchema = new Schema<IConversationRead>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  contextType: { type: String, enum: ["group", "dm"], required: true },
  contextId: { type: Schema.Types.ObjectId, required: true },
  lastReadAt: { type: Date, default: () => new Date(0) },
});

conversationReadSchema.index({ userId: 1, contextType: 1, contextId: 1 }, { unique: true });

export default mongoose.model<IConversationRead>("ConversationRead", conversationReadSchema);
