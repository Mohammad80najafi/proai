import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  transaction: vi.fn(),
  promptFindOne: vi.fn(),
  promptCreate: vi.fn(),
  promptUpdateOne: vi.fn(),
  promptVersionFindOne: vi.fn(),
  promptVersionCreate: vi.fn(),
  improvementExists: vi.fn(),
  improvementCreate: vi.fn(),
  discussionCreate: vi.fn(),
  userUpdateOne: vi.fn(),
  userFind: vi.fn(),
  commentFindOne: vi.fn(),
  commentCreate: vi.fn(),
  commentUpdateOne: vi.fn(),
  createNotification: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  session: { id: "content-action-session" },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/dal", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  connectToDatabase: vi.fn(async () => ({
    connection: { transaction: mocks.transaction },
  })),
}));
vi.mock("@/models/Prompt", () => ({
  contentVisibilities: ["draft", "public", "unlisted"],
  promptCategories: [
    "development",
    "writing",
    "design",
    "business",
    "education",
    "research",
    "productivity",
    "other",
  ],
  Prompt: {
    findOne: mocks.promptFindOne,
    create: mocks.promptCreate,
    updateOne: mocks.promptUpdateOne,
  },
}));
vi.mock("@/models/PromptVersion", () => ({
  PromptVersion: {
    findOne: mocks.promptVersionFindOne,
    create: mocks.promptVersionCreate,
  },
}));
vi.mock("@/models/ImprovementRequest", () => ({
  ImprovementRequest: {
    exists: mocks.improvementExists,
    create: mocks.improvementCreate,
  },
  ImprovementDiscussionMessage: {
    create: mocks.discussionCreate,
  },
}));
vi.mock("@/models/Comment", () => ({
  Comment: {
    findOne: mocks.commentFindOne,
    create: mocks.commentCreate,
    updateOne: mocks.commentUpdateOne,
  },
}));
vi.mock("@/models/User", () => ({
  User: { find: mocks.userFind, updateOne: mocks.userUpdateOne },
}));
vi.mock("@/features/content/mutation-services", () => ({
  awardReputation: vi.fn(),
  createNotification: mocks.createNotification,
}));

import {
  addCommentAction,
  openImprovementRequestAction,
} from "@/features/content/actions";

describe("openImprovementRequestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: new Types.ObjectId(),
      username: "contributor",
      roles: [],
    });
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => {
        await callback(mocks.session);
      },
    );
    mocks.improvementExists.mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    });
    mocks.improvementCreate.mockResolvedValue([]);
    mocks.discussionCreate.mockResolvedValue([]);
    mocks.createNotification.mockResolvedValue(undefined);
  });

  it("creates an improvement request without duplicating the prompt", async () => {
    const targetId = new Types.ObjectId();
    const baseVersionId = new Types.ObjectId();
    const ownerId = new Types.ObjectId();
    mocks.promptFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: targetId,
        title: "Source prompt",
        category: "development",
        license: "cc-by-4.0",
        creatorId: ownerId,
        currentVersionId: baseVersionId,
      }),
    });
    mocks.promptVersionFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: baseVersionId,
        promptId: targetId,
        title: "Source prompt",
        description: "Original prompt description",
        content: "Original prompt body",
        category: "development",
        tags: ["test"],
        license: "cc-by-4.0",
      }),
    });

    const formData = new FormData();
    formData.set("targetType", "Prompt");
    formData.set("targetId", String(targetId));
    formData.set("baseVersionId", String(baseVersionId));
    formData.set("requestTitle", "Improve prompt structure");
    formData.set("summary", "Clarify the requested output structure.");
    formData.set("title", "Improved source prompt");
    formData.set("description", "Original prompt description");
    formData.set("content", "Original prompt body with a clearer output format");
    formData.set("category", "development");
    formData.set("tags", "test");
    formData.set("license", "cc-by-4.0");

    await openImprovementRequestAction({ status: "idle" }, formData);

    expect(mocks.promptCreate).not.toHaveBeenCalled();
    expect(mocks.promptVersionCreate).not.toHaveBeenCalled();
    const createdRequest = mocks.improvementCreate.mock.calls[0]?.[0]?.[0];
    expect(createdRequest).toMatchObject({
      targetType: "Prompt",
      targetId,
      ownerId,
      proposerId: expect.any(Types.ObjectId),
      baseVersionId,
      status: "open",
    });
    expect(createdRequest).not.toHaveProperty("forkId");
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/improvements/${String(createdRequest._id)}`,
    );
  });
});

describe("addCommentAction replies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: new Types.ObjectId(),
      username: "replier",
      roles: [],
    });
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => {
        await callback(mocks.session);
      },
    );
    mocks.userFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([]),
      }),
    });
    mocks.commentCreate.mockResolvedValue([]);
    mocks.commentUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mocks.promptUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mocks.createNotification.mockResolvedValue(undefined);
  });

  it("keeps a reply-to-reply in the root thread and notifies the addressed user", async () => {
    const targetId = new Types.ObjectId();
    const ownerId = new Types.ObjectId();
    const rootId = new Types.ObjectId();
    const repliedToId = new Types.ObjectId();
    const repliedToUserId = new Types.ObjectId();
    mocks.promptFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: targetId,
        slug: "test-prompt",
        creatorId: ownerId,
        stats: { comments: 2 },
      }),
    });
    mocks.commentFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue({
          _id: repliedToId,
          userId: repliedToUserId,
          parentId: rootId,
        }),
      }),
    });

    const formData = new FormData();
    formData.set("targetType", "Prompt");
    formData.set("targetId", String(targetId));
    formData.set("parentId", String(repliedToId));
    formData.set("content", "این هم ادامه گفت‌وگو");

    const result = await addCommentAction({ status: "idle" }, formData);

    expect(result.status).toBe("success");
    const createdComment = mocks.commentCreate.mock.calls[0]?.[0]?.[0];
    expect(String(createdComment.parentId)).toBe(String(rootId));
    expect(mocks.commentUpdateOne).toHaveBeenCalledWith(
      { _id: rootId, status: "visible" },
      { $inc: { replyCount: 1 } },
      { session: mocks.session },
    );
    expect(mocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: repliedToUserId,
        title: "پاسخ تازه‌ای به دیدگاه شما داده شد",
      }),
    );
  });

  it("rejects a reply when the parent is not visible on the same content", async () => {
    const targetId = new Types.ObjectId();
    mocks.promptFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: targetId,
        slug: "test-prompt",
        creatorId: new Types.ObjectId(),
        stats: { comments: 1 },
      }),
    });
    mocks.commentFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue(null),
      }),
    });

    const formData = new FormData();
    formData.set("targetType", "Prompt");
    formData.set("targetId", String(targetId));
    formData.set("parentId", String(new Types.ObjectId()));
    formData.set("content", "پاسخ نامعتبر");

    const result = await addCommentAction({ status: "idle" }, formData);

    expect(result).toMatchObject({ status: "error" });
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });
});
