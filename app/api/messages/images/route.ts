import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { isConversationMember } from "@/features/chat/service";
import { isSameOriginRequest } from "@/features/chat/validation";
import { getOptionalUser } from "@/lib/auth/dal";

const MAX_IMAGE_BYTES = 5_000_000;

function imageExtension(bytes: Uint8Array, type: string) {
  if (type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (type === "image/webp" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const contentLength = request.headers.get("content-length");
  const declaredLength = Number(contentLength);
  if (!contentLength || !Number.isSafeInteger(declaredLength) || declaredLength <= 0) {
    return Response.json({ error: "length required" }, { status: 411 });
  }
  if (declaredLength > MAX_IMAGE_BYTES + 100_000) {
    return Response.json({ error: "image too large" }, { status: 413 });
  }

  const user = await getOptionalUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }
  const conversationId = formData.get("conversationId");
  const file = formData.get("image");
  if (
    typeof conversationId !== "string" ||
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_IMAGE_BYTES ||
    !(await isConversationMember(conversationId, user.id))
  ) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes, file.type);
  if (!extension) {
    return Response.json({ error: "invalid image" }, { status: 415 });
  }

  const directory = path.join(process.cwd(), "public", "uploads", "messages");
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
  return Response.json({ url: `/uploads/messages/${filename}` }, { status: 201 });
}
