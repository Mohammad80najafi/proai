import { createServer } from "node:http";

import { Server, type Socket } from "socket.io";
import { z } from "zod";

import { isConversationMember, markConversationRead, sendMessage } from "../features/chat/service";
import type {
  ChatMessageNotification,
  ConversationReadEvent,
  PresenceEvent,
  PresenceSnapshot,
} from "../features/chat/types";
import { SESSION_COOKIE_NAME } from "../lib/auth/constants";
import { validateSessionToken } from "../lib/auth/session-validation";

const port = Number(process.env.REALTIME_PORT ?? 3001);
const appOrigin = process.env.APP_URL ?? "http://localhost:3000";
const AUTH_CACHE_MS = 30_000;
const AUTH_REVALIDATION_INTERVAL_MS = 5 * 60_000;
const MAX_SOCKET_LIFETIME_MS = 12 * 60 * 60_000;

type SessionUser = NonNullable<Awaited<ReturnType<typeof validateSessionToken>>>;

type RealtimeAuthState = {
  rawToken: string;
  user: SessionUser;
  connectedAt: number;
  lastValidatedAt: number;
  validationPromise: Promise<SessionUser | null> | null;
};

type JoinAcknowledgement = { ok: boolean };
type MessageAcknowledgement = {
  ok: boolean;
  message?: unknown;
  error?: string;
};

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i);
const conversationPayloadSchema = z
  .object({ conversationId: objectIdSchema })
  .strict();
const typingPayloadSchema = z
  .object({
    conversationId: objectIdSchema,
    active: z.boolean().optional().default(false),
  })
  .strict();
const messagePayloadSchema = z
  .object({
    conversationId: objectIdSchema,
    content: z.string().trim().min(1).max(12_000),
    clientNonce: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  response.writeHead(404).end();
});

const io = new Server(httpServer, {
  cors: { origin: appOrigin, credentials: true },
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 64 * 1024,
});
const socketsByUser = new Map<string, number>();

function cookieValue(header: string | undefined, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function acknowledge<T>(candidate: unknown, value: T) {
  if (typeof candidate !== "function") return;

  try {
    (candidate as (result: T) => void)(value);
  } catch (error) {
    console.error("[realtime] acknowledgement failed", error);
  }
}

function runSocketTask(
  eventName: string,
  task: () => void | Promise<void>,
  onError?: () => void,
) {
  void Promise.resolve()
    .then(task)
    .catch((error: unknown) => {
      console.error(`[realtime] ${eventName} failed`, error);
      try {
        onError?.();
      } catch (callbackError) {
        console.error(`[realtime] ${eventName} error callback failed`, callbackError);
      }
    });
}

function disconnectInvalidSession(socket: Socket) {
  if (socket.connected) socket.disconnect(true);
}

io.use((socket, next) => {
  runSocketTask(
    "authentication",
    async () => {
      const rawToken = cookieValue(
        socket.handshake.headers.cookie,
        SESSION_COOKIE_NAME,
      );
      const user = rawToken ? await validateSessionToken(rawToken) : null;
      if (!rawToken || !user) {
        next(new Error("unauthorized"));
        return;
      }

      const now = Date.now();
      socket.data.auth = {
        rawToken,
        user,
        connectedAt: now,
        lastValidatedAt: now,
        validationPromise: null,
      } satisfies RealtimeAuthState;
      next();
    },
    () => next(new Error("authentication failed")),
  );
});

io.on("connection", (socket) => {
  const authCandidate = socket.data.auth as RealtimeAuthState | undefined;
  if (
    !authCandidate ||
    typeof authCandidate.rawToken !== "string" ||
    typeof authCandidate.user?.id !== "string"
  ) {
    disconnectInvalidSession(socket);
    return;
  }
  const auth = authCandidate as RealtimeAuthState;

  const userId = auth.user.id;
  let presenceRegistered = false;

  async function revalidateSession(force = false): Promise<SessionUser | null> {
    if (
      !force &&
      Date.now() - auth.lastValidatedAt < AUTH_CACHE_MS
    ) {
      return auth.user;
    }

    if (auth.validationPromise) return auth.validationPromise;

    const validation = validateSessionToken(auth.rawToken)
      .then((user) => {
        if (!user || user.id !== userId) {
          disconnectInvalidSession(socket);
          return null;
        }

        auth.user = user;
        auth.lastValidatedAt = Date.now();
        return user;
      })
      .finally(() => {
        if (auth.validationPromise === validation) {
          auth.validationPromise = null;
        }
      });

    auth.validationPromise = validation;
    return validation;
  }

  runSocketTask(
    "connection setup",
    async () => {
      await socket.join(`user:${userId}`);
      if (!socket.connected) return;

      presenceRegistered = true;
      socketsByUser.set(userId, (socketsByUser.get(userId) ?? 0) + 1);
      io.emit("presence", { userId, online: true } satisfies PresenceEvent);
      socket.emit("presence:snapshot", {
        userIds: Array.from(socketsByUser.keys()),
      } satisfies PresenceSnapshot);
    },
    () => disconnectInvalidSession(socket),
  );

  const periodicValidationTimer = setInterval(() => {
    if (!socket.connected) return;
    runSocketTask("periodic authentication", async () => {
      await revalidateSession(true);
    });
  }, AUTH_REVALIDATION_INTERVAL_MS);
  periodicValidationTimer.unref();

  const maximumLifetimeTimer = setTimeout(() => {
    runSocketTask("maximum socket lifetime", () => {
      if (socket.connected) socket.conn.close();
    });
  }, MAX_SOCKET_LIFETIME_MS);
  maximumLifetimeTimer.unref();

  socket.on(
    "conversation:join",
    (payload: unknown, acknowledgementCandidate?: unknown) => {
      runSocketTask(
        "conversation:join",
        async () => {
          const parsed = conversationPayloadSchema.safeParse(payload);
          if (!parsed.success) {
            acknowledge<JoinAcknowledgement>(acknowledgementCandidate, {
              ok: false,
            });
            return;
          }

          const currentUser = await revalidateSession(true);
          if (!currentUser) {
            acknowledge<JoinAcknowledgement>(acknowledgementCandidate, {
              ok: false,
            });
            return;
          }

          const { conversationId } = parsed.data;
          const allowed = await isConversationMember(conversationId, userId);
          if (allowed) {
            await socket.join(`conversation:${conversationId}`);
            const readResult = await markConversationRead(conversationId, userId);
            io.to(`user:${userId}`).emit("conversation:read", {
              conversationId,
              notificationsRead: readResult.notificationsRead,
            } satisfies ConversationReadEvent);
          }
          acknowledge<JoinAcknowledgement>(acknowledgementCandidate, {
            ok: allowed,
          });
        },
        () =>
          acknowledge<JoinAcknowledgement>(acknowledgementCandidate, {
            ok: false,
          }),
      );
    },
  );

  socket.on("conversation:leave", (payload: unknown) => {
    runSocketTask("conversation:leave", async () => {
      const parsed = conversationPayloadSchema.safeParse(payload);
      if (!parsed.success) return;
      await socket.leave(`conversation:${parsed.data.conversationId}`);
    });
  });

  socket.on("conversation:read", (payload: unknown) => {
    runSocketTask("conversation:read", async () => {
      const parsed = conversationPayloadSchema.safeParse(payload);
      if (!parsed.success || !(await revalidateSession())) return;
      if (!(await isConversationMember(parsed.data.conversationId, userId))) return;

      const readResult = await markConversationRead(parsed.data.conversationId, userId);
      io.to(`user:${userId}`).emit("conversation:read", {
        conversationId: parsed.data.conversationId,
        notificationsRead: readResult.notificationsRead,
      } satisfies ConversationReadEvent);
    });
  });

  socket.on("typing", (payload: unknown) => {
    runSocketTask("typing", async () => {
      const parsed = typingPayloadSchema.safeParse(payload);
      if (!parsed.success) return;

      const currentUser = await revalidateSession();
      if (!currentUser) return;

      const { conversationId, active } = parsed.data;
      if (!(await isConversationMember(conversationId, userId))) return;

      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        active,
      });
    });
  });

  socket.on(
    "message:send",
    (payload: unknown, acknowledgementCandidate?: unknown) => {
      runSocketTask(
        "message:send",
        async () => {
          const parsed = messagePayloadSchema.safeParse(payload);
          if (!parsed.success) {
            acknowledge<MessageAcknowledgement>(acknowledgementCandidate, {
              ok: false,
              error: "ارسال پیام انجام نشد.",
            });
            return;
          }

          const currentUser = await revalidateSession(true);
          if (!currentUser) {
            acknowledge<MessageAcknowledgement>(acknowledgementCandidate, {
              ok: false,
              error: "ارسال پیام انجام نشد.",
            });
            return;
          }

          const delivery = await sendMessage({
            conversationId: parsed.data.conversationId,
            senderId: userId,
            content: parsed.data.content,
            clientNonce: parsed.data.clientNonce,
          });
          if (delivery.created) {
            io.to(`conversation:${parsed.data.conversationId}`).emit(
              "message:new",
              delivery.message,
            );
            for (const recipientId of delivery.recipientIds) {
              io.to(`user:${recipientId}`).emit("message:notification", {
                message: delivery.message,
                href: `/messages?conversation=${parsed.data.conversationId}`,
              } satisfies ChatMessageNotification);
            }
          }
          acknowledge<MessageAcknowledgement>(acknowledgementCandidate, {
            ok: true,
            message: delivery.message,
          });
        },
        () =>
          acknowledge<MessageAcknowledgement>(acknowledgementCandidate, {
            ok: false,
            error: "ارسال پیام انجام نشد.",
          }),
      );
    },
  );

  socket.on("disconnect", () => {
    clearInterval(periodicValidationTimer);
    clearTimeout(maximumLifetimeTimer);

    if (!presenceRegistered) return;
    const remaining = Math.max(0, (socketsByUser.get(userId) ?? 1) - 1);
    if (remaining === 0) {
      socketsByUser.delete(userId);
      io.emit("presence", { userId, online: false } satisfies PresenceEvent);
    } else {
      socketsByUser.set(userId, remaining);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`ProAI realtime gateway listening on http://localhost:${port}`);
});
