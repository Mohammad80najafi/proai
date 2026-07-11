import { getOptionalUser } from "@/lib/auth/dal";
import { getConversationMessages } from "@/features/chat/data";
import { markConversationRead, sendMessage } from "@/features/chat/service";
import {
  isJsonRequest,
  isSameOriginRequest,
  MARK_READ_BODY_LIMIT,
  markConversationReadRequestSchema,
  readLimitedJson,
  SEND_MESSAGE_BODY_LIMIT,
  sendMessageRequestSchema,
} from "@/features/chat/validation";

function validateMutationHeaders(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isJsonRequest(request)) {
    return Response.json({ error: "invalid input" }, { status: 415 });
  }
  return null;
}

export async function GET(request: Request) {
  const user = await getOptionalUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const conversationId = new URL(request.url).searchParams.get("conversationId") ?? "";
  const result = await getConversationMessages(conversationId, user.id);
  if (!result) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(result);
}

export async function POST(request: Request) {
  const headerError = validateMutationHeaders(request);
  if (headerError) return headerError;

  const user = await getOptionalUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await readLimitedJson(request, SEND_MESSAGE_BODY_LIMIT);
  if (!body.success) {
    return Response.json({ error: "invalid input" }, { status: body.status });
  }
  const parsed = sendMessageRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  try {
    const { message } = await sendMessage({
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      content: parsed.data.content,
      image: parsed.data.image ? {
        url: parsed.data.image.url,
        width: parsed.data.image.width ?? null,
        height: parsed.data.image.height ?? null,
      } : null,
      clientNonce: parsed.data.clientNonce,
    });
    return Response.json({ message });
  } catch {
    return Response.json({ error: "message failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const headerError = validateMutationHeaders(request);
  if (headerError) return headerError;

  const user = await getOptionalUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await readLimitedJson(request, MARK_READ_BODY_LIMIT);
  if (!body.success) {
    return Response.json({ error: "invalid input" }, { status: body.status });
  }
  const parsed = markConversationReadRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const result = await markConversationRead(parsed.data.conversationId, user.id);
  return Response.json({ success: true, ...result });
}
