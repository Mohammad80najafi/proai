import "server-only";

import { z } from "zod";

import { DEFAULT_MONGODB_URI } from "@/lib/db/config";

const serverEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .trim()
    .refine(
      (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must be a MongoDB connection string",
    )
    .default(DEFAULT_MONGODB_URI),
  AUTH_SECRET: z.string().min(32).optional(),
  OTP_PROVIDER: z.enum(["console", "kavenegar"]).default("console"),
  KAVENEGAR_API_KEY: z.string().trim().min(1).optional(),
  KAVENEGAR_OTP_TEMPLATE: z.string().trim().min(1).default("proai-otp"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-5.4-mini"),
  AI_PROVIDER: z.enum(["openai", "ollama", "disabled"]).default("disabled"),
  OLLAMA_BASE_URL: z.url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().trim().min(1).default("qwen3:8b"),
  APP_URL: z.url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= serverEnvSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    AUTH_SECRET: process.env.AUTH_SECRET,
    OTP_PROVIDER: process.env.OTP_PROVIDER,
    KAVENEGAR_API_KEY: process.env.KAVENEGAR_API_KEY,
    KAVENEGAR_OTP_TEMPLATE: process.env.KAVENEGAR_OTP_TEMPLATE,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    APP_URL: process.env.APP_URL,
  });

  return cachedEnv;
}
