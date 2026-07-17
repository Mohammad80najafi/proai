import { z } from "zod";

import { MESSAGE_IMAGE_URL_PATTERN } from "@/lib/upload-paths";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i);

export const chatImageSchema = z
  .object({
    url: z.string().regex(MESSAGE_IMAGE_URL_PATTERN),
    width: z.number().int().min(1).max(20_000).nullable().optional(),
    height: z.number().int().min(1).max(20_000).nullable().optional(),
  })
  .strict();

export const sendMessageRequestSchema = z
  .object({
    conversationId: objectIdSchema,
    content: z.string().trim().max(12_000).default(""),
    image: chatImageSchema.nullable().optional(),
    clientNonce: z.string().trim().min(1).max(80).nullable().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.content || value.image), { message: "empty message" });

export const markConversationReadRequestSchema = z
  .object({ conversationId: objectIdSchema })
  .strict();

// Accommodates a long UTF-8 message plus JSON overhead while preventing an
// unbounded request body when Content-Length is absent or dishonest.
export const SEND_MESSAGE_BODY_LIMIT = 64 * 1024;
export const MARK_READ_BODY_LIMIT = 512;

export function isJsonRequest(request: Request) {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  return mediaType === "application/json";
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

type LimitedJsonResult =
  | { success: true; data: unknown }
  | { success: false; status: 400 | 413 };

export async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0) {
      return { success: false, status: 400 };
    }
    if (length > maxBytes) return { success: false, status: 413 };
  }

  if (!request.body) return { success: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { success: false, status: 413 };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { success: true, data: JSON.parse(text) as unknown };
  } catch {
    return { success: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
