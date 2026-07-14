import { describe, expect, it } from "vitest";

import { buildPersonalizedExploreUpdate } from "@/features/explore/personalization";
import type { ContentCardDTO } from "@/features/shared/types";

const card: ContentCardDTO = {
  id: "content-1",
  kind: "prompt",
  slug: "content-1",
  title: "Prompt",
  description: "Description",
  category: "Development",
  tags: [],
  version: 2,
  author: {
    id: "user-1",
    username: "creator",
    displayName: "Creator",
    avatar: null,
    rank: "builder",
    reputationScore: 10,
  },
  stats: {
    likes: 0,
    saves: 1,
    comments: 0,
    forks: 0,
    ratingAverage: 0,
    ratingCount: 0,
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
  images: [],
};

describe("personalized Explore updates", () => {
  it("includes recent content from followed creators", () => {
    expect(buildPersonalizedExploreUpdate(card, true, undefined)).toMatchObject({
      reason: "following",
      unread: false,
      previousVersion: null,
    });
  });

  it("marks a saved item unread when its version advances", () => {
    expect(
      buildPersonalizedExploreUpdate(card, false, {
        targetType: "Prompt",
        targetId: card.id,
        versionAtSave: 1,
        lastSeenVersion: 1,
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
      }),
    ).toMatchObject({
      reason: "saved-update",
      unread: true,
      previousVersion: 1,
    });
  });

  it("does not invent an update for a legacy save created after the latest version", () => {
    expect(
      buildPersonalizedExploreUpdate(card, false, {
        targetType: "Prompt",
        targetId: card.id,
        createdAt: new Date("2026-07-15T00:00:00.000Z"),
      }),
    ).toBeNull();
  });
});
