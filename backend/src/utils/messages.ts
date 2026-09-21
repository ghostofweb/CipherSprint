import { Types } from "mongoose";
import Message, { ChatContextType, IMessage } from "../models/Message";
import DirectConversation from "../models/DirectConversation";
import Group from "../models/Group";

const PREVIEW_LENGTH = 140;

interface PostMessageInput {
  contextType: ChatContextType;
  contextId: string | Types.ObjectId;
  senderId: string | Types.ObjectId;
  senderUsername: string;
  text: string;
}

// Single write path for chat messages -- used by the socket handler only
// (REST only serves history) so persistence + side effects live in one
// place regardless of transport.
export async function postMessage({ contextType, contextId, senderId, senderUsername, text }: PostMessageInput): Promise<IMessage> {
  const message = await Message.create({ contextType, contextId, senderId, senderUsername, text });
  const preview = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;

  if (contextType === "dm") {
    await DirectConversation.updateOne(
      { _id: contextId },
      { lastMessageAt: message.createdAt, lastMessageText: preview, lastMessageSenderUsername: senderUsername }
    );
  } else {
    await Group.updateOne(
      { _id: contextId },
      { lastMessageAt: message.createdAt, lastMessageText: preview, lastMessageSenderUsername: senderUsername }
    );
  }

  return message;
}
