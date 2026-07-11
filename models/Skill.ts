import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import {
  objectId,
  optionalObjectId,
  slugPattern,
  timestampOptions,
} from "@/models/_shared";
import { contentVisibilities } from "@/models/Prompt";

const WorkflowStepSchema = new Schema(
  {
    order: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    instruction: { type: String, required: true, trim: true, maxlength: 4_000 },
  },
  { _id: false },
);

const SkillDependencySchema = new Schema(
  {
    skillId: optionalObjectId("Skill"),
    name: { type: String, required: true, trim: true, maxlength: 120 },
    versionRange: { type: String, trim: true, maxlength: 32, default: "*" },
    optional: { type: Boolean, default: false },
  },
  { _id: false },
);

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 140,
      match: slugPattern,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1_000,
    },
    instructions: { type: String, required: true, minlength: 20, maxlength: 100_000 },
    requiredKnowledge: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    workflow: { type: [WorkflowStepSchema], default: [] },
    tools: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    dependencies: { type: [SkillDependencySchema], default: [] },
    creatorId: objectId("User"),
    currentVersionId: optionalObjectId("SkillVersion"),
    currentVersion: { type: Number, min: 1, default: 1 },
    currentVersionLabel: { type: String, trim: true, maxlength: 32, default: "1.0.0" },
    visibility: {
      type: String,
      enum: contentVisibilities,
      default: "draft",
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ["visible", "under-review", "removed"],
      default: "visible",
      index: true,
    },
    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxlength: 32 }],
      default: [],
    },
    license: {
      type: String,
      enum: ["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"],
      default: "unspecified",
    },
    forkedFrom: {
      skillId: optionalObjectId("Skill"),
      versionId: optionalObjectId("SkillVersion"),
      creatorId: optionalObjectId("User"),
    },
    stats: {
      likes: { type: Number, min: 0, default: 0 },
      saves: { type: Number, min: 0, default: 0 },
      forks: { type: Number, min: 0, default: 0 },
      comments: { type: Number, min: 0, default: 0 },
      ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
      ratingCount: { type: Number, min: 0, default: 0 },
      users: { type: Number, min: 0, default: 0 },
    },
    aiScore: { type: Number, min: 0, max: 100, default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  timestampOptions,
);

SkillSchema.index(
  { name: "text", description: "text", tags: "text", requiredKnowledge: "text" },
  {
    name: "skill_search",
    default_language: "none",
    weights: { name: 8, tags: 4, description: 2, requiredKnowledge: 2 },
  },
);
SkillSchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "unique_skill_slug",
    partialFilterExpression: { slug: { $type: "string" } },
  },
);
SkillSchema.index({ visibility: 1, moderationStatus: 1, publishedAt: -1 });
SkillSchema.index({ creatorId: 1, createdAt: -1 });
SkillSchema.index({ tags: 1, visibility: 1 });

export type SkillDocument = InferSchemaType<typeof SkillSchema>;

export const Skill =
  (models.Skill as Model<SkillDocument> | undefined) ??
  model<SkillDocument>("Skill", SkillSchema);
