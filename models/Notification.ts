import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

export const notificationTypes = [
  "follow",
  "like",
  "comment",
  "mention",
  "improvement-opened",
  "improvement-message",
  "improvement-changes-requested",
  "improvement-accepted",
  "improvement-rejected",
  "message",
  "achievement",
  "system",
] as const;

const NotificationSchema = new Schema(
  {
    recipientId: objectId("User"),
    actorId: optionalObjectId("User"),
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, trim: true, maxlength: 600, default: "" },
    entityModel: {
      type: String,
      enum: [
        "User",
        "Prompt",
        "Skill",
        "Comment",
        "ImprovementRequest",
        "Conversation",
        "Message",
        "Achievement",
      ],
      default: null,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: "entityModel",
      default: null,
    },
    href: { type: String, trim: true, maxlength: 1_024, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, trim: true, maxlength: 240, default: null },
    readAt: { type: Date, default: null },
  },
  timestampOptions,
);

NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index(
  { recipientId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
    name: "unique_notification_dedupe",
  },
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;

export const Notification =
  (models.Notification as Model<NotificationDocument> | undefined) ??
  model<NotificationDocument>("Notification", NotificationSchema);

