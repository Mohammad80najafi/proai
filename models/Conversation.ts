import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

const ConversationSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "improvement"], required: true },
    directKey: { type: String, trim: true, maxlength: 80, default: null },
    contextModel: {
      type: String,
      enum: ["ImprovementRequest"],
      default: null,
    },
    contextId: {
      type: Schema.Types.ObjectId,
      refPath: "contextModel",
      default: null,
    },
    createdById: objectId("User"),
    lastMessageId: optionalObjectId("Message"),
    lastMessageAt: { type: Date, default: null, index: true },
    closedAt: { type: Date, default: null },
  },
  timestampOptions,
);

ConversationSchema.index(
  { directKey: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "direct", directKey: { $type: "string" } },
    name: "unique_direct_conversation",
  },
);
ConversationSchema.index(
  { contextModel: 1, contextId: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "improvement" },
    name: "unique_improvement_conversation",
  },
);
ConversationSchema.index({ lastMessageAt: -1 });

const ConversationMemberSchema = new Schema(
  {
    conversationId: objectId("Conversation"),
    userId: objectId("User"),
    role: { type: String, enum: ["member", "owner", "contributor"], default: "member" },
    unreadCount: { type: Number, min: 0, default: 0 },
    lastReadMessageId: optionalObjectId("Message"),
    lastReadAt: { type: Date, default: null },
    mutedUntil: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
  },
  timestampOptions,
);
ConversationMemberSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true, name: "unique_conversation_member" },
);
ConversationMemberSchema.index({ userId: 1, archivedAt: 1, updatedAt: -1 });

const MessageSchema = new Schema(
  {
    conversationId: objectId("Conversation"),
    senderId: optionalObjectId("User"),
    type: { type: String, enum: ["text", "system"], default: "text" },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 12_000 },
    replyToId: optionalObjectId("Message"),
    readBy: { type: [objectId("User")], default: [] },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    clientNonce: { type: String, trim: true, maxlength: 80, default: null },
  },
  timestampOptions,
);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index(
  { conversationId: 1, senderId: 1, clientNonce: 1 },
  {
    unique: true,
    partialFilterExpression: { clientNonce: { $type: "string" } },
    name: "unique_message_nonce",
  },
);

export type ConversationDocument = InferSchemaType<typeof ConversationSchema>;
export type ConversationMemberDocument = InferSchemaType<typeof ConversationMemberSchema>;
export type MessageDocument = InferSchemaType<typeof MessageSchema>;

export const Conversation =
  (models.Conversation as Model<ConversationDocument> | undefined) ??
  model<ConversationDocument>("Conversation", ConversationSchema);
export const ConversationMember =
  (models.ConversationMember as Model<ConversationMemberDocument> | undefined) ??
  model<ConversationMemberDocument>("ConversationMember", ConversationMemberSchema);
export const Message =
  (models.Message as Model<MessageDocument> | undefined) ??
  model<MessageDocument>("Message", MessageSchema);

