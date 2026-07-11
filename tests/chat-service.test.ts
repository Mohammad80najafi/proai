import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  consumeRateLimit: vi.fn(),
  conversationFindOne: vi.fn(),
  conversationFindById: vi.fn(),
  conversationUpdateOne: vi.fn(),
  memberFind: vi.fn(),
  memberUpdateOne: vi.fn(),
  memberUpdateMany: vi.fn(),
  memberExists: vi.fn(),
  messageFindOne: vi.fn(),
  messageCreate: vi.fn(),
  notificationInsertMany: vi.fn(),
  notificationUpdateMany: vi.fn(),
  userFind: vi.fn(),
  session: { id: "chat-service-session" },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: mocks.consumeRateLimit }));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(async () => ({
    connection: { transaction: mocks.transaction },
  })),
}));
vi.mock("@/models/Conversation", () => ({
  Conversation: {
    findOne: mocks.conversationFindOne,
    findById: mocks.conversationFindById,
    updateOne: mocks.conversationUpdateOne,
  },
  ConversationMember: {
    find: mocks.memberFind,
    updateOne: mocks.memberUpdateOne,
    updateMany: mocks.memberUpdateMany,
    exists: mocks.memberExists,
  },
  Message: {
    findOne: mocks.messageFindOne,
    create: mocks.messageCreate,
  },
}));
vi.mock("@/models/Notification", () => ({
  Notification: {
    insertMany: mocks.notificationInsertMany,
    updateMany: mocks.notificationUpdateMany,
  },
}));
vi.mock("@/models/User", () => ({ User: { find: mocks.userFind } }));

import { markConversationRead, sendMessage } from "@/features/chat/service";

describe("sendMessage", () => {
  const conversationId = new Types.ObjectId();
  const senderId = new Types.ObjectId();
  const recipientId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true });
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => {
        await callback(mocks.session);
      },
    );
    mocks.conversationFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue({ type: "direct" }),
      }),
    });
    mocks.memberFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([
          { userId: senderId },
          { userId: recipientId },
        ]),
      }),
    });
    mocks.userFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([
          {
            _id: senderId,
            username: "sender",
            displayName: "Sender",
            avatar: null,
          },
          {
            _id: recipientId,
            username: "recipient",
            displayName: "Recipient",
            avatar: null,
          },
        ]),
      }),
    });
    mocks.messageFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    });
    mocks.messageCreate.mockResolvedValue([]);
    mocks.conversationUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.memberUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.memberUpdateMany.mockResolvedValue({ matchedCount: 1 });
    mocks.notificationInsertMany.mockResolvedValue([]);
    mocks.notificationUpdateMany.mockResolvedValue({ modifiedCount: 0 });
  });

  it("returns recipient delivery metadata for a newly created message", async () => {
    const result = await sendMessage({
      conversationId: String(conversationId),
      senderId: String(senderId),
      content: "Hello",
      clientNonce: "nonce-1",
    });

    expect(result.created).toBe(true);
    expect(result.recipientIds).toEqual([String(recipientId)]);
    expect(result.message).toMatchObject({
      conversationId: String(conversationId),
      content: "Hello",
      sender: { id: String(senderId) },
    });
    expect(mocks.memberUpdateMany).toHaveBeenCalledWith(
      {
        conversationId: String(conversationId),
        userId: { $in: [String(recipientId)] },
        leftAt: null,
      },
      { $inc: { unreadCount: 1 } },
      { session: mocks.session },
    );
    expect(mocks.notificationInsertMany).toHaveBeenCalledOnce();
  });

  it("marks nonce replays as existing so realtime delivery is not duplicated", async () => {
    mocks.messageFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        content: "Hello",
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        clientNonce: "nonce-1",
      }),
    });

    const result = await sendMessage({
      conversationId: String(conversationId),
      senderId: String(senderId),
      content: "Hello",
      clientNonce: "nonce-1",
    });

    expect(result.created).toBe(false);
    expect(result.recipientIds).toEqual([String(recipientId)]);
    expect(mocks.messageCreate).not.toHaveBeenCalled();
    expect(mocks.memberUpdateMany).not.toHaveBeenCalled();
    expect(mocks.notificationInsertMany).not.toHaveBeenCalled();
  });

  it("marks conversation message notifications read and returns the cleared count", async () => {
    const conversationId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const lastMessageId = new Types.ObjectId();
    mocks.conversationFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ lastMessageId }),
      }),
    });
    mocks.memberUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.notificationUpdateMany.mockResolvedValue({ modifiedCount: 3 });

    const result = await markConversationRead(
      String(conversationId),
      String(userId),
    );

    expect(result).toEqual({ notificationsRead: 3 });
    expect(mocks.memberUpdateOne).toHaveBeenCalledWith(
      {
        conversationId: String(conversationId),
        userId: String(userId),
        leftAt: null,
      },
      {
        $set: expect.objectContaining({
          unreadCount: 0,
          lastReadMessageId: lastMessageId,
        }),
      },
    );
    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith(
      {
        recipientId: String(userId),
        type: "message",
        entityModel: "Conversation",
        entityId: String(conversationId),
        readAt: null,
      },
      { $set: { readAt: expect.any(Date) } },
    );
  });
});
