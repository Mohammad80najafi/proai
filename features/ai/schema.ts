import { z } from "zod";

export const analysisDimensionSchema = z.object({
  key: z.enum(["clarity", "structure", "context", "constraints", "examples", "output-format"]),
  label: z.string(),
  score: z.number().int().min(0).max(100),
  feedback: z.string(),
});

export const analysisSuggestionSchema = z.object({
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  description: z.string(),
});

export const promptAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  dimensions: z.array(analysisDimensionSchema).min(6).max(6),
  strengths: z.array(z.string()).max(6),
  suggestions: z.array(analysisSuggestionSchema).max(8),
  enhancedPrompt: z.string(),
});

export type PromptAnalysis = z.infer<typeof promptAnalysisSchema>;

export type AIResult = PromptAnalysis & {
  provider: "openai" | "ollama" | "local";
  model: string;
};
