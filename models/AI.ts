import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

import { objectId, targetTypes, timestampOptions } from "@/models/_shared";

const AIJobSchema = new Schema(
  {
    requesterId: objectId("User"),
    type: { type: String, enum: ["analyze", "enhance"], required: true },
    provider: { type: String, enum: ["openai", "ollama"], required: true },
    model: { type: String, required: true, trim: true, maxlength: 120 },
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    inputHash: { type: String, required: true, maxlength: 128 },
    requestKey: { type: String, required: true, unique: true, maxlength: 240 },
    output: { type: Schema.Types.Mixed, default: null },
    errorCode: { type: String, trim: true, maxlength: 80, default: null },
    errorMessage: { type: String, trim: true, maxlength: 1_000, default: null },
    attempts: { type: Number, min: 0, max: 10, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  timestampOptions,
);
AIJobSchema.index({ status: 1, createdAt: 1 });
AIJobSchema.index({ requesterId: 1, createdAt: -1 });
AIJobSchema.index({ targetType: 1, targetId: 1, type: 1, createdAt: -1 });

const AnalysisDimensionSchema = new Schema(
  {
    key: {
      type: String,
      enum: ["clarity", "structure", "context", "constraints", "examples", "output-format"],
      required: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true, trim: true, maxlength: 1_000 },
  },
  { _id: false },
);

const AnalysisSuggestionSchema = new Schema(
  {
    severity: { type: String, enum: ["info", "warning", "critical"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 1_000 },
  },
  { _id: false },
);

const AIAnalysisSchema = new Schema(
  {
    jobId: { ...objectId("AIJob"), unique: true },
    targetType: { type: String, enum: targetTypes, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    analyzedVersionId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 2_000 },
    dimensions: { type: [AnalysisDimensionSchema], default: [] },
    suggestions: { type: [AnalysisSuggestionSchema], default: [] },
    provider: { type: String, enum: ["openai", "ollama"], required: true },
    model: { type: String, required: true, trim: true, maxlength: 120 },
    inputHash: { type: String, required: true, maxlength: 128 },
  },
  timestampOptions,
);
AIAnalysisSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export type AIJobDocument = InferSchemaType<typeof AIJobSchema>;
export type AIAnalysisDocument = InferSchemaType<typeof AIAnalysisSchema>;

export const AIJob =
  (models.AIJob as Model<AIJobDocument> | undefined) ??
  model<AIJobDocument>("AIJob", AIJobSchema);
export const AIAnalysis =
  (models.AIAnalysis as Model<AIAnalysisDocument> | undefined) ??
  model<AIAnalysisDocument>("AIAnalysis", AIAnalysisSchema);

