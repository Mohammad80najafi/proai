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
  getNewsStory: vi.fn(),
  newsFindOne: vi.fn(),
  newsCreate: vi.fn(),
  newsUpdateOne: vi.fn(),
  revalidatePath: vi.fn(),
  session: { id: "admin-action-session" },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/dal", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/db", () => ({ connectToDatabase: mocks.connectToDatabase }));
vi.mock("@/features/news/data", () => ({ getNewsStory: mocks.getNewsStory }));
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
vi.mock("@/models/NewsArticle", () => ({
  NewsArticle: {
    findOne: mocks.newsFindOne,
    create: mocks.newsCreate,
    updateOne: mocks.newsUpdateOne,
  },
}));

import {
  createNewsAction,
  deleteNewsAction,
  updateContentStatusAction,
  updateNewsAction,
  updateUserStatusAction,
} from "@/features/admin/actions";

function newsForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    slug: "admin-news-story",
    title: "یک خبر کامل برای جامعه هوش مصنوعی",
    summary: "این خلاصه برای آزمایش گردش کار ساخت و انتشار خبر در پنل مدیریت است.",
    category: "محصول",
    source: "ProAI",
    sourceUrl: "https://example.com/news/admin-story",
    coverImage: "/images/news/ai-agent-newsroom-cover.png",
    readTimeMinutes: "5",
    status: "published",
    featured: "on",
    accentTheme: "mint",
    publishedAt: "2026-07-13",
    sectionHeading1: "جزئیات خبر",
    sectionParagraphs1: "این پاراگراف نخست خبر است و جزئیات لازم را برای کاربران توضیح می‌دهد.",
    sectionHeading2: "",
    sectionParagraphs2: "",
    takeaways: "نکته نخست\nنکته دوم",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

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
    mocks.newsCreate.mockResolvedValue([]);
    mocks.newsUpdateOne.mockResolvedValue({ modifiedCount: 1 });
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

  it("creates and audits a published news story", async () => {
    mocks.getNewsStory.mockResolvedValue(undefined);

    const result = await createNewsAction({ status: "idle" }, newsForm());

    expect(result).toMatchObject({ status: "success", data: { id: "admin-news-story" } });
    expect(mocks.newsCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        slug: "admin-news-story",
        status: "published",
        featured: true,
        publishedAt: expect.any(Date),
      })],
      { session: mocks.session },
    );
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ targetModel: "NewsArticle", action: "news-created" })],
      { session: mocks.session },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/news/admin-news-story");
  });

  it("creates a managed override when an initial news story is edited", async () => {
    mocks.getNewsStory.mockResolvedValue({ slug: "admin-news-story" });
    mocks.newsFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(null) }),
    });
    const formData = newsForm({ originalSlug: "admin-news-story", title: "عنوان تازه خبر برای صفحه اصلی" });

    const result = await updateNewsAction({ status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(mocks.newsUpdateOne).toHaveBeenCalledWith(
      { slug: "admin-news-story" },
      expect.objectContaining({
        $set: expect.objectContaining({ title: "عنوان تازه خبر برای صفحه اصلی" }),
        $setOnInsert: expect.objectContaining({ _id: expect.any(Types.ObjectId) }),
      }),
      { upsert: true, session: mocks.session },
    );
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ action: "news-updated" })],
      { session: mocks.session },
    );
  });

  it("soft-deletes an initial story with a tombstone so it cannot reappear", async () => {
    mocks.getNewsStory.mockResolvedValue({
      slug: "admin-news-story",
      title: "خبر قابل حذف",
      summary: "خلاصه خبر قابل حذف برای آزمایش مسیر حذف نرم در سامانه مدیریت.",
      category: "محصول",
      source: "ProAI",
      sourceUrl: "https://example.com/news/admin-story",
      coverImage: "/images/news/ai-agent-newsroom-cover.png",
      accentTheme: "mint",
      sections: [{ heading: "جزئیات", paragraphs: ["متن خبر قابل حذف برای ساخت رکورد نشانه در پایگاه داده."] }],
      takeaways: ["نکته خبر"],
    });
    mocks.newsFindOne.mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(null) }),
    });
    const formData = new FormData();
    formData.set("slug", "admin-news-story");

    const result = await deleteNewsAction({ status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(mocks.newsUpdateOne).toHaveBeenCalledWith(
      { slug: "admin-news-story" },
      expect.objectContaining({
        $set: { deletedAt: expect.any(Date), status: "draft" },
        $setOnInsert: expect.not.objectContaining({ deletedAt: expect.anything() }),
      }),
      { upsert: true, session: mocks.session },
    );
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ action: "news-deleted" })],
      { session: mocks.session },
    );
  });
});
