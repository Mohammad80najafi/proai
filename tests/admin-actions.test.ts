import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  connectToDatabase: vi.fn(),
  transaction: vi.fn(),
  userFindById: vi.fn(),
  userFindOne: vi.fn(),
  userUpdateOne: vi.fn(),
  sessionUpdateMany: vi.fn(),
  moderationCreate: vi.fn(),
  promptFindById: vi.fn(),
  promptUpdateOne: vi.fn(),
  skillFindById: vi.fn(),
  skillUpdateOne: vi.fn(),
  reportFindOne: vi.fn(),
  reportUpdateOne: vi.fn(),
  revalidatePath: vi.fn(),
  session: { id: "admin-action-session" },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/dal", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/db", () => ({ connectToDatabase: mocks.connectToDatabase }));
vi.mock("@/models/User", () => ({
  User: {
    findById: mocks.userFindById,
    findOne: mocks.userFindOne,
    updateOne: mocks.userUpdateOne,
  },
}));
vi.mock("@/models/Session", () => ({ Session: { updateMany: mocks.sessionUpdateMany } }));
vi.mock("@/models/Moderation", () => ({
  ModerationAction: { create: mocks.moderationCreate },
  Report: { findOne: mocks.reportFindOne, updateOne: mocks.reportUpdateOne },
}));
vi.mock("@/models/Prompt", () => ({
  Prompt: { findById: mocks.promptFindById, updateOne: mocks.promptUpdateOne },
}));
vi.mock("@/models/Skill", () => ({
  Skill: { findById: mocks.skillFindById, updateOne: mocks.skillUpdateOne },
}));

import {
  updateContentStatusAction,
  updateUserStatusAction,
} from "@/features/admin/actions";

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      id: String(new Types.ObjectId()),
      roles: ["user", "moderator", "admin"],
    });
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => callback(mocks.session),
    );
    mocks.connectToDatabase.mockResolvedValue({ connection: { transaction: mocks.transaction } });
    mocks.userUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mocks.sessionUpdateMany.mockResolvedValue({ modifiedCount: 1 });
    mocks.moderationCreate.mockResolvedValue([]);
  });

  it("requires the admin role, suspends the account, revokes sessions, and writes an audit event", async () => {
    const targetId = new Types.ObjectId();
    mocks.userFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue({ accountStatus: "active" }),
      }),
    });
    const formData = new FormData();
    formData.set("userId", String(targetId));
    formData.set("status", "suspended");

    const result = await updateUserStatusAction({ status: "idle" }, formData);

    expect(mocks.requireRole).toHaveBeenCalledWith("admin");
    expect(result.status).toBe("success");
    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith(
      { userId: targetId, revokedAt: null },
      { $set: { revokedAt: expect.any(Date) } },
      { session: mocks.session },
    );
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        moderatorId: expect.any(String),
        targetModel: "User",
        targetId,
        action: "user-status-updated",
      })],
      { session: mocks.session },
    );
  });

  it("does not let an admin suspend their own account", async () => {
    const adminId = new Types.ObjectId();
    mocks.requireRole.mockResolvedValue({ id: String(adminId), roles: ["admin"] });
    const formData = new FormData();
    formData.set("userId", String(adminId));
    formData.set("status", "suspended");

    const result = await updateUserStatusAction({ status: "idle" }, formData);

    expect(result).toMatchObject({ status: "error" });
    expect(mocks.connectToDatabase).not.toHaveBeenCalled();
  });

  it("moderates content inside an audited admin transaction", async () => {
    const promptId = new Types.ObjectId();
    mocks.promptFindById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue({ slug: "moderated-prompt", moderationStatus: "visible" }),
      }),
    });
    mocks.promptUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    const formData = new FormData();
    formData.set("targetId", String(promptId));
    formData.set("targetType", "Prompt");
    formData.set("status", "under-review");

    const result = await updateContentStatusAction({ status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(mocks.promptUpdateOne).toHaveBeenCalledWith(
      { _id: promptId },
      { $set: { moderationStatus: "under-review" } },
      { session: mocks.session },
    );
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ action: "content-status-updated", targetId: promptId })],
      { session: mocks.session },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/prompts/moderated-prompt");
  });
});
