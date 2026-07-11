import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, optionalObjectId, timestampOptions } from "@/models/_shared";

const VersionWorkflowStepSchema = new Schema(
  {
    order: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    instruction: { type: String, required: true, trim: true, maxlength: 4_000 },
  },
  { _id: false },
);

const VersionDependencySchema = new Schema(
  {
    skillId: optionalObjectId("Skill"),
    name: { type: String, required: true, trim: true, maxlength: 120 },
    versionRange: { type: String, trim: true, maxlength: 32, default: "*" },
    optional: { type: Boolean, default: false },
  },
  { _id: false },
);

const SkillVersionSchema = new Schema(
  {
    skillId: objectId("Skill"),
    versionNumber: { type: Number, required: true, min: 1, immutable: true },
    versionLabel: { type: String, trim: true, maxlength: 32, default: "1.0.0" },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1_000 },
    instructions: { type: String, required: true, minlength: 20, maxlength: 100_000 },
    requiredKnowledge: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    workflow: { type: [VersionWorkflowStepSchema], default: [] },
    tools: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    dependencies: { type: [VersionDependencySchema], default: [] },
    tags: { type: [{ type: String, lowercase: true, trim: true }], default: [] },
    license: {
      type: String,
      enum: ["unspecified", "cc-by-4.0", "cc-by-sa-4.0", "mit", "proprietary"],
      default: "unspecified",
    },
    changeSummary: { type: String, required: true, trim: true, maxlength: 2_000 },
    authorId: objectId("User"),
    parentVersionId: optionalObjectId("SkillVersion"),
    acceptedRequestId: optionalObjectId("ImprovementRequest"),
    source: {
      type: String,
      enum: ["initial", "owner", "accepted-improvement", "import"],
      required: true,
    },
    contentHash: { type: String, required: true, maxlength: 128 },
    isOfficial: { type: Boolean, default: true, immutable: true },
  },
  timestampOptions,
);

SkillVersionSchema.index(
  { skillId: 1, versionNumber: 1 },
  { unique: true, name: "unique_skill_version" },
);
SkillVersionSchema.index({ skillId: 1, createdAt: -1 });
SkillVersionSchema.index({ authorId: 1, createdAt: -1 });

export type SkillVersionDocument = InferSchemaType<typeof SkillVersionSchema>;

export const SkillVersion =
  (models.SkillVersion as Model<SkillVersionDocument> | undefined) ??
  model<SkillVersionDocument>("SkillVersion", SkillVersionSchema);
