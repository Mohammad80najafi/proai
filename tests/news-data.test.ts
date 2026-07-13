import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectToDatabase: vi.fn(),
  rows: [] as Array<Record<string, unknown>>,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ connectToDatabase: mocks.connectToDatabase }));
vi.mock("@/models/NewsArticle", () => ({
  NewsArticle: {
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        lean: vi.fn(async () => mocks.rows),
      })),
    })),
  },
}));

import { defaultNewsStories, getNewsStories } from "@/features/news/data";

describe("news data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rows = [];
    mocks.connectToDatabase.mockResolvedValue(undefined);
  });

  it("keeps the editorial defaults when no managed news exists", async () => {
    const stories = await getNewsStories();

    expect(stories).toHaveLength(defaultNewsStories.length);
    expect(stories.every((story) => story.status === "published" && story.managed === false)).toBe(true);
  });

  it("replaces a default story with its managed edit", async () => {
    const original = defaultNewsStories[0];
    mocks.rows = [{
      _id: "managed-news-id",
      slug: original.slug,
      title: "عنوان مدیریت‌شده",
      summary: original.summary,
      category: original.category,
      source: original.source,
      sourceUrl: original.sourceUrl,
      coverImage: original.coverImage,
      readTimeMinutes: 8,
      sections: original.sections,
      takeaways: original.takeaways,
      status: "published",
      featured: true,
      accentTheme: "sky",
      publishedAt: new Date("2026-07-13T00:00:00.000Z"),
      deletedAt: null,
    }];

    const stories = await getNewsStories();
    const edited = stories.find((story) => story.slug === original.slug);

    expect(edited).toMatchObject({
      id: "managed-news-id",
      title: "عنوان مدیریت‌شده",
      managed: true,
      status: "published",
      accentTheme: "sky",
    });
    expect(stories.filter((story) => story.slug === original.slug)).toHaveLength(1);
  });

  it("hides drafts publicly but includes them for the admin desk", async () => {
    mocks.rows = [{
      _id: "draft-news-id",
      slug: "private-draft",
      title: "پیش‌نویس خبر",
      summary: "خلاصه‌ای کامل برای خبر پیش‌نویس پنل مدیریت.",
      category: "محصول",
      source: "ProAI",
      sourceUrl: "https://example.com/private-draft",
      coverImage: "/images/news/ai-agent-newsroom-cover.png",
      readTimeMinutes: 4,
      sections: [{ heading: "بدنه", paragraphs: ["متن کامل پیش‌نویس خبر برای آزمایش نمایش مدیریت."] }],
      takeaways: [],
      status: "draft",
      featured: false,
      accentTheme: "mint",
      publishedAt: null,
      deletedAt: null,
    }];

    const publicStories = await getNewsStories();
    const adminStories = await getNewsStories({ includeDrafts: true });

    expect(publicStories.some((story) => story.slug === "private-draft")).toBe(false);
    expect(adminStories.some((story) => story.slug === "private-draft")).toBe(true);
  });

  it("uses a tombstone to hide a deleted default story", async () => {
    const original = defaultNewsStories[0];
    mocks.rows = [{ slug: original.slug, deletedAt: new Date(), status: "draft" }];

    const stories = await getNewsStories({ includeDrafts: true });

    expect(stories.some((story) => story.slug === original.slug)).toBe(false);
  });
});
