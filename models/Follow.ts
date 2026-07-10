import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, timestampOptions } from "@/models/_shared";

const FollowSchema = new Schema(
  {
    followerId: objectId("User"),
    followingId: objectId("User"),
  },
  timestampOptions,
);

FollowSchema.index(
  { followerId: 1, followingId: 1 },
  { unique: true, name: "unique_follow" },
);
FollowSchema.index({ followingId: 1, createdAt: -1 });
FollowSchema.index({ followerId: 1, createdAt: -1 });

export type FollowDocument = InferSchemaType<typeof FollowSchema>;

export const Follow =
  (models.Follow as Model<FollowDocument> | undefined) ??
  model<FollowDocument>("Follow", FollowSchema);

