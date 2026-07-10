import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, timestampOptions } from "@/models/_shared";

const SessionSchema = new Schema(
  {
    userId: objectId("User"),
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, trim: true, maxlength: 512, default: "" },
    ipHash: { type: String, maxlength: 128, select: false, default: null },
  },
  timestampOptions,
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: -1 });

export type SessionDocument = InferSchemaType<typeof SessionSchema>;

export const Session =
  (models.Session as Model<SessionDocument> | undefined) ??
  model<SessionDocument>("Session", SessionSchema);

