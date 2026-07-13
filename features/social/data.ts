import "server-only";

import { Follow } from "@/models/Follow";
import { Notification } from "@/models/Notification";
import { Prompt } from "@/models/Prompt";
import { Achievement, ReputationEvent, UserAchievement } from "@/models/Reputation";
import { Skill } from "@/models/Skill";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/db";
import type { ContentCardDTO, NotificationDTO, UserSummary } from "@/features/shared/types";

type RawUser = { _id: unknown; username: string; displayName: string; avatar?: string | null; bio?: string; rank: string; reputationScore: number; stats?: { followers?: number; following?: number; prompts?: number; skills?: number; acceptedImprovements?: number }; createdAt: Date };

export type ProfileDTO = {
  user: UserSummary & { bio: string; createdAt: string; stats: { followers: number; following: number; prompts: number; skills: number; acceptedImprovements: number } };
  isOwnProfile: boolean;
  isFollowing: boolean;
  prompts: ContentCardDTO[];
  skills: ContentCardDTO[];
  achievements: Array<{ id: string; name: string; description: string; icon: string; tier: string; awardedAt: string }>;
  contributionEvents: number;
};

function summary(user: RawUser): UserSummary { return { id: String(user._id), username: user.username, displayName: user.displayName, avatar: user.avatar ?? null, rank: user.rank, reputationScore: user.reputationScore }; }
function stats(value?: RawUser["stats"]) { return { followers: value?.followers ?? 0, following: value?.following ?? 0, prompts: value?.prompts ?? 0, skills: value?.skills ?? 0, acceptedImprovements: value?.acceptedImprovements ?? 0 }; }
function contentStats(value?: Record<string, number>) { return { likes: value?.likes ?? 0, saves: value?.saves ?? 0, comments: value?.comments ?? 0, forks: value?.forks ?? 0, ratingAverage: value?.ratingAverage ?? 0, ratingCount: value?.ratingCount ?? 0 }; }

export async function getProfile(username: string, viewerId?: string | null): Promise<ProfileDTO | null> {
  await connectToDatabase();
  const user = await User.findOne({ username: username.toLowerCase(), accountStatus: "active" }).select("username displayName avatar bio rank reputationScore stats createdAt").lean<RawUser | null>();
  if (!user) return null;
  const profileUserId = String(user._id);
  const [promptRows, skillRows, following, earned, contributionEvents] = await Promise.all([
    Prompt.find({ creatorId: profileUserId, visibility: "public", moderationStatus: "visible" }).sort({ publishedAt: -1 }).limit(30).lean<Array<{ _id: unknown; title: string; slug: string; description: string; images?: Array<{ url: string; alt: string }>; category: string; tags: string[]; currentVersion: number; stats?: Record<string, number>; createdAt: Date; updatedAt: Date }>>(),
    Skill.find({ creatorId: profileUserId, visibility: "public", moderationStatus: "visible" }).sort({ publishedAt: -1 }).limit(30).lean<Array<{ _id: unknown; name: string; slug: string; description: string; images?: Array<{ url: string; alt: string }>; tags: string[]; currentVersion: number; stats?: Record<string, number>; createdAt: Date; updatedAt: Date }>>(),
    viewerId ? Follow.exists({ followerId: viewerId, followingId: profileUserId }) : Promise.resolve(null),
    UserAchievement.find({ userId: profileUserId }).sort({ awardedAt: -1 }).lean<Array<{ achievementId: unknown; awardedAt: Date }>>(),
    ReputationEvent.countDocuments({ userId: profileUserId }),
  ]);
  const achievementRows = earned.length ? await Achievement.find({ _id: { $in: earned.map((item) => item.achievementId) }, isActive: true }).lean<Array<{ _id: unknown; name: string; description: string; icon: string; tier: string }>>() : [];
  const achievementMap = new Map(achievementRows.map((item) => [String(item._id), item]));
  const author = summary(user);
  const categoryLabels: Record<string, string> = { development: "برنامه‌نویسی", writing: "تولید محتوا", design: "طراحی", business: "کسب‌وکار", education: "آموزش", research: "تحقیق", productivity: "بهره‌وری", other: "سایر" };
  return {
    user: { ...author, bio: user.bio ?? "", createdAt: user.createdAt.toISOString(), stats: stats(user.stats) },
    isOwnProfile: viewerId === String(user._id), isFollowing: Boolean(following),
    prompts: promptRows.map((item) => ({ id: String(item._id), kind: "prompt", slug: item.slug, title: item.title, description: item.description, images: item.images ?? [], category: categoryLabels[item.category] ?? item.category, tags: item.tags, version: item.currentVersion, author, stats: contentStats(item.stats), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    skills: skillRows.map((item) => ({ id: String(item._id), kind: "skill", slug: item.slug, title: item.name, description: item.description, images: item.images ?? [], category: "مهارت", tags: item.tags, version: item.currentVersion, author, stats: contentStats(item.stats), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    achievements: earned.flatMap((item) => { const achievement = achievementMap.get(String(item.achievementId)); return achievement ? [{ id: String(achievement._id), name: achievement.name, description: achievement.description, icon: achievement.icon, tier: achievement.tier, awardedAt: item.awardedAt.toISOString() }] : []; }),
    contributionEvents,
  };
}

function notificationType(type: string): NotificationDTO["type"] { if (type === "follow") return "follow"; if (type === "like") return "like"; if (type === "comment") return "comment"; if (type === "mention") return "mention"; if (type === "message") return "message"; if (type === "achievement") return "achievement"; return "improvement"; }

export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  await connectToDatabase();
  const rows = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(100).lean<Array<{ _id: unknown; actorId?: unknown | null; type: string; title: string; body: string; href: string; readAt?: Date | null; createdAt: Date }>>();
  const actors = await User.find({ _id: { $in: rows.map((item) => item.actorId).filter(Boolean) } }).select("username displayName avatar rank reputationScore").lean<RawUser[]>();
  const actorMap = new Map(actors.map((item) => [String(item._id), summary(item)]));
  return rows.map((item) => ({ id: String(item._id), type: notificationType(item.type), actor: item.actorId ? actorMap.get(String(item.actorId)) ?? null : null, title: item.title, description: item.body, href: item.href, read: Boolean(item.readAt), createdAt: item.createdAt.toISOString() }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  await connectToDatabase();
  return Notification.countDocuments({ recipientId: userId, readAt: null });
}

export async function getLeaderboard(limit = 20) {
  await connectToDatabase();
  return User.find({ accountStatus: "active" }).sort({ reputationScore: -1 }).limit(limit).select("username displayName avatar bio rank reputationScore stats").lean<Array<RawUser>>();
}
