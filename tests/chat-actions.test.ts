import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  transaction: vi.fn(),
  conversationFindOne: vi.fn(),
  conversationCreate: vi.fn(),
  conversationMemberCreate: vi.fn(),
  userFindOne: vi.fn(),
  followCountDocuments: vi.fn(),
  followExists: vi.fn(),
  redirect: vi.fn(),
  session: { id: "transaction-session" },
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/dal", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(async () => ({
    connection: { transaction: mocks.transaction },
  })),
}));
vi.mock("@/models/Conversation", () => ({
  Conversation: {
    findOne: mocks.conversationFindOne,
    create: mocks.conversationCreate,
  },
  ConversationMember: { create: mocks.conversationMemberCreate },
}));
vi.mock("@/models/Follow", () => ({
  Follow: {
    countDocuments: mocks.followCountDocuments,
    exists: mocks.followExists,
  },
}));
vi.mock("@/models/User", () => ({
  User: { findOne: mocks.userFindOne },
}));
vi.mock("@/features/content/mutation-helpers", () => ({
  PublicActionError: class PublicActionError extends Error {},
  actionFailure: vi.fn(() => ({ status: "error", message: "failed" })),
  authIdentity: (value: unknown) => value,
  formDataObject: (formData: FormData) => Object.fromEntries(formData.entries()),
  validationState: vi.fn(() => ({ status: "error", message: "invalid" })),
}));

import { createConversationAction } from "@/features/chat/actions";

describe("createConversationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates both members in ordered mode inside the transaction", async () => {
    const currentUserId = new Types.ObjectId();
    const targetUserId = new Types.ObjectId();
    const conversationId = new Types.ObjectId();

    mocks.requireUser.mockResolvedValue({ id: currentUserId, roles: [] });
    mocks.conversationFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    });
    mocks.userFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue({ messagingPolicy: "everyone" }),
      }),
    });
    mocks.conversationCreate.mockResolvedValue([{ _id: conversationId }]);
    mocks.conversationMemberCreate.mockResolvedValue([]);
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => {
        await callback(mocks.session);
      },
    );

    const formData = new FormData();
    formData.set("targetUserId", String(targetUserId));
    await createConversationAction({ status: "idle" }, formData);

    const [members, options] = mocks.conversationMemberCreate.mock.calls[0] as [
      Array<{ userId: Types.ObjectId }>,
      { session: typeof mocks.session; ordered?: boolean },
    ];

    expect(members.map(({ userId }) => String(userId))).toEqual([
      String(currentUserId),
      String(targetUserId),
    ]);
    expect(options).toEqual({ session: mocks.session, ordered: true });
    expect(mocks.redirect).toHaveBeenCalledWith(`/messages?conversation=${conversationId}`);
  });
});
