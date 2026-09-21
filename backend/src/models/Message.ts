import mongoose, { Schema, Document, Types } from "mongoose";

export type ChatContextType = "group" | "dm";

export interface IMessage extends Document {
  contextType: ChatContextType;
  contextId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderUsername: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    contextType: { type: String, enum: ["group", "dm"], required: true },
    contextId: { type: Schema.Types.ObjectId, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderUsername: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// One collection serves both group and DM chat -- history pagination and
// the socket room scheme are identical for both instead of duplicated.
messageSchema.index({ contextType: 1, contextId: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", messageSchema);
