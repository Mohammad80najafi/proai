import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  transaction: vi.fn(),
  promptFindOne: vi.fn(),
  promptCreate: vi.fn(),
  promptUpdateOne: vi.fn(),
  promptVersionCreate: vi.fn(),
  userUpdateOne: vi.fn(),
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
  PromptVersion: { create: mocks.promptVersionCreate },
}));
vi.mock("@/models/User", () => ({ User: { updateOne: mocks.userUpdateOne } }));
vi.mock("@/features/content/mutation-services", () => ({
  awardReputation: vi.fn(),
  createNotification: mocks.createNotification,
}));

import { forkPromptAction } from "@/features/content/actions";

describe("forkPromptAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: new Types.ObjectId(),
      username: "forker",
      roles: [],
    });
    mocks.transaction.mockImplementation(
      async (callback: (session: typeof mocks.session) => Promise<void>) => {
        await callback(mocks.session);
      },
    );
    mocks.promptCreate.mockResolvedValue([]);
    mocks.promptUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.promptVersionCreate.mockResolvedValue([]);
    mocks.userUpdateOne.mockResolvedValue({ matchedCount: 1 });
    mocks.createNotification.mockResolvedValue(undefined);
  });

  it("keeps the viewer on the source prompt and returns the new fork link", async () => {
    const sourceId = new Types.ObjectId();
    mocks.promptFindOne.mockReturnValue({
      session: vi.fn().mockResolvedValue({
        _id: sourceId,
        slug: "source-prompt",
        title: "Source prompt",
        description: "A source prompt description",
        content: "Prompt body",
        category: "development",
        tags: ["test"],
        visibility: "public",
        moderationStatus: "visible",
        license: "CC-BY-4.0",
        creatorId: new Types.ObjectId(),
        currentVersionId: new Types.ObjectId(),
        currentVersion: 1,
        stats: { forks: 2 },
      }),
    });

    const formData = new FormData();
    formData.set("targetId", String(sourceId));
    const result = await forkPromptAction({ status: "idle" }, formData);

    expect(result).toMatchObject({
      status: "success",
      data: { count: 3, slug: expect.any(String) },
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/prompts/source-prompt");
  });
});
