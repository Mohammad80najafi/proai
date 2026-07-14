import type { ContentCardDTO, ExploreUpdateDTO } from "@/features/shared/types";

export type SavedContentVersion = {
  targetType: "Prompt" | "Skill";
  targetId: unknown;
  versionAtSave?: number;
  lastSeenVersion?: number;
  createdAt: Date;
};

export function resolveSavedVersion(
  card: ContentCardDTO,
  save: SavedContentVersion,
) {
  const savedBeforeLatestUpdate =
    new Date(card.updatedAt).getTime() > new Date(save.createdAt).getTime();
  return save.lastSeenVersion ??
    save.versionAtSave ??
    (savedBeforeLatestUpdate ? Math.max(1, card.version - 1) : card.version);
}

export function buildPersonalizedExploreUpdate(
  card: ContentCardDTO,
  isFollowing: boolean,
  save: SavedContentVersion | undefined,
): ExploreUpdateDTO | null {
  const previousVersion = save ? resolveSavedVersion(card, save) : null;
  const hasSavedUpdate = previousVersion !== null && card.version > previousVersion;

  if (!isFollowing && !hasSavedUpdate) return null;

  return {
    ...card,
    reason: hasSavedUpdate
      ? isFollowing
        ? "following-and-saved-update"
        : "saved-update"
      : "following",
    unread: hasSavedUpdate,
    previousVersion,
  };
}
