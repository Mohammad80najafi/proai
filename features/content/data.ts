import "server-only";

import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { Comment } from "@/models/Comment";
import { Like, Rating, Save } from "@/models/Interaction";
import { Prompt, promptCategories } from "@/models/Prompt";
import { PromptVersion } from "@/models/PromptVersion";
import { Skill } from "@/models/Skill";
import { SkillVersion } from "@/models/SkillVersion";
import { User } from "@/models/User";
import type {
  CommentDTO,
  ContentCardDTO,
  ContentImage,
  ContentStats,
  PromptDetailDTO,
  SkillDetailDTO,
  UserSummary,
  VersionDTO,
  ViewerState,
} from "@/features/shared/types";

type RawUser = {
  _id: unknown;
  username: string;
  displayName: string;
  avatar?: string | null;
  rank?: string;
  reputationScore?: number;
};

type RawStats = Partial<{
  likes: number;
  saves: number;
  forks: number;
  comments: number;
  ratingAverage: number;
  ratingCount: number;
}>;

type RawPrompt = {
  _id: unknown;
  title: string;
  slug: string;
  description: string;
  content: string;
  images?: ContentImage[];
  category: string;
  creatorId: unknown;
  currentVersion: number;
  currentVersionLabel?: string;
  visibility: "draft" | "public" | "unlisted";
  tags?: string[];
  stats?: RawStats;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
  forkedFrom?: { promptId?: unknown; versionId?: unknown } | null;
};

type RawSkill = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  images?: ContentImage[];
  requiredKnowledge?: string[];
  workflow?: Array<{ order: number; title: string; instruction: string }>;
  tools?: string[];
  dependencies?: Array<{ name: string; versionRange: string; optional?: boolean }>;
  creatorId: unknown;
  currentVersion: number;
  currentVersionLabel?: string;
  visibility: "draft" | "public" | "unlisted";
  tags?: string[];
  stats?: RawStats;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
  forkedFrom?: { skillId?: unknown; versionId?: unknown } | null;
};

type RawVersion = {
  _id: unknown;
  versionNumber: number;
  versionLabel?: string;
  content?: string;
  instructions?: string;
  changeSummary: string;
  authorId: unknown;
  source?: "initial" | "owner" | "accepted-improvement" | "import";
  createdAt: Date;
};

const categoryLabels: Record<string, string> = {
  development: "برنامه‌نویسی",
  writing: "تولید محتوا",
  design: "طراحی",
  business: "کسب‌وکار",
  education: "آموزش",
  research: "تحقیق",
  productivity: "بهره‌وری",
  other: "سایر",
};

const fallbackUser: UserSummary = {
  id: "unknown",
  username: "deleted-user",
  displayName: "کاربر حذف‌شده",
  avatar: null,
  rank: "beginner",
  reputationScore: 0,
};

function id(value: unknown) {
  return String(value ?? "");
}

function date(value: Date | string | undefined) {
  return new Date(value ?? 0).toISOString();
}

function serializeUser(user: RawUser): UserSummary {
  return {
    id: id(user._id),
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ?? null,
    rank: user.rank ?? "beginner",
    reputationScore: user.reputationScore ?? 0,
  };
}

function serializeStats(stats?: RawStats): ContentStats {
  return {
    likes: stats?.likes ?? 0,
    saves: stats?.saves ?? 0,
    comments: stats?.comments ?? 0,
    forks: stats?.forks ?? 0,
    ratingAverage: stats?.ratingAverage ?? 0,
    ratingCount: stats?.ratingCount ?? 0,
  };
}

async function userMapFor(ids: unknown[]) {
  const uniqueIds = [...new Set(ids.map(id).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, UserSummary>();
  const users = await User.find({ _id: { $in: uniqueIds } })
    .select("username displayName avatar rank reputationScore")
    .lean<RawUser[]>();
  return new Map(users.map((user) => [id(user._id), serializeUser(user)]));
}

function promptCard(prompt: RawPrompt, users: Map<string, UserSummary>): ContentCardDTO {
  return {
    id: id(prompt._id),
    kind: "prompt",
    slug: prompt.slug,
    title: prompt.title,
    description: prompt.description,
    category: categoryLabels[prompt.category] ?? prompt.category,
    tags: prompt.tags ?? [],
    version: prompt.currentVersion,
    author: users.get(id(prompt.creatorId)) ?? fallbackUser,
    stats: serializeStats(prompt.stats),
    createdAt: date(prompt.createdAt),
    updatedAt: date(prompt.updatedAt),
    images: prompt.images ?? [],
  };
}

function skillCard(skill: RawSkill, users: Map<string, UserSummary>): ContentCardDTO {
  return {
    id: id(skill._id),
    kind: "skill",
    slug: skill.slug,
    title: skill.name,
    description: skill.description,
    category: "مهارت",
    tags: skill.tags ?? [],
    version: skill.currentVersion,
    author: users.get(id(skill.creatorId)) ?? fallbackUser,
    stats: serializeStats(skill.stats),
    createdAt: date(skill.createdAt),
    updatedAt: date(skill.updatedAt),
    images: skill.images ?? [],
  };
}

export type ExploreParams = {
  query?: string;
  category?: string;
  sort?: "newest" | "popular" | "rating";
  limit?: number;
};

export async function getExploreContent(params: ExploreParams = {}) {
  await connectToDatabase();
  const query = params.query?.trim();
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 48);
  const sort: Record<string, 1 | -1> =
    params.sort === "popular"
      ? { "stats.likes": -1 as const, publishedAt: -1 as const }
      : params.sort === "rating"
        ? { "stats.ratingAverage": -1 as const, "stats.ratingCount": -1 as const }
        : { publishedAt: -1 as const, createdAt: -1 as const };

  const category = promptCategories.includes(params.category as (typeof promptCategories)[number])
    ? (params.category as (typeof promptCategories)[number])
    : undefined;
  const promptFilter = {
    visibility: "public" as const,
    moderationStatus: "visible" as const,
    ...(query ? { $text: { $search: query } } : {}),
    ...(category ? { category } : {}),
  };
  const skillFilter = {
    visibility: "public" as const,
    moderationStatus: "visible" as const,
    ...(query ? { $text: { $search: query } } : {}),
  };

  const [prompts, skills] = await Promise.all([
    Prompt.find(promptFilter).sort(sort).limit(limit).lean<RawPrompt[]>(),
    Skill.find(skillFilter).sort(sort).limit(limit).lean<RawSkill[]>(),
  ]);
  const users = await userMapFor([
    ...prompts.map((prompt) => prompt.creatorId),
    ...skills.map((skill) => skill.creatorId),
  ]);

  return {
    prompts: prompts.map((prompt) => promptCard(prompt, users)),
    skills: skills.map((skill) => skillCard(skill, users)),
  };
}

async function getViewerState(
  viewerId: string | null,
  targetType: "Prompt" | "Skill",
  targetId: string,
  ownerId: unknown,
): Promise<ViewerState> {
  if (!viewerId || !Types.ObjectId.isValid(viewerId)) {
    return { isAuthenticated: false, isOwner: false, hasLiked: false, hasSaved: false, rating: null };
  }

  const [like, save, rating] = await Promise.all([
    Like.exists({ userId: viewerId, targetType, targetId }),
    Save.exists({ userId: viewerId, targetType, targetId }),
    Rating.findOne({ userId: viewerId, targetType, targetId }).select("value").lean<{ value: number } | null>(),
  ]);
  return {
    isAuthenticated: true,
    isOwner: id(ownerId) === viewerId,
    hasLiked: Boolean(like),
    hasSaved: Boolean(save),
    rating: rating?.value ?? null,
  };
}

async function serializeVersions(rows: RawVersion[]): Promise<VersionDTO[]> {
  const users = await userMapFor(rows.map((row) => row.authorId));
  return rows.map((row) => ({
    id: id(row._id),
    versionNumber: row.versionNumber,
    versionLabel: row.versionLabel ?? `${row.versionNumber}.0.0`,
    content: row.content ?? row.instructions ?? "",
    changes: row.changeSummary,
    author: users.get(id(row.authorId)) ?? fallbackUser,
    source: row.source ?? "owner",
    createdAt: date(row.createdAt),
  }));
}

export async function getPromptBySlug(slug: string, viewerId: string | null = null): Promise<PromptDetailDTO | null> {
  await connectToDatabase();
  const visibilityFilter = viewerId && Types.ObjectId.isValid(viewerId)
    ? { $or: [{ visibility: { $in: ["public", "unlisted"] as const } }, { creatorId: viewerId }] }
    : { visibility: { $in: ["public", "unlisted"] as const } };
  const prompt = await Prompt.findOne({ slug, moderationStatus: "visible", ...visibilityFilter }).lean<RawPrompt | null>();
  if (!prompt) return null;

  const [users, versionRows, viewer, source] = await Promise.all([
    userMapFor([prompt.creatorId]),
    PromptVersion.find({ promptId: id(prompt._id) }).sort({ versionNumber: -1 }).lean<RawVersion[]>(),
    getViewerState(viewerId, "Prompt", id(prompt._id), prompt.creatorId),
    prompt.forkedFrom?.promptId && prompt.forkedFrom?.versionId
      ? Promise.all([
          Prompt.findById(prompt.forkedFrom.promptId).select("title slug").lean<{ title: string; slug: string } | null>(),
          PromptVersion.findById(prompt.forkedFrom.versionId).select("versionNumber").lean<{ versionNumber: number } | null>(),
        ])
      : Promise.resolve(null),
  ]);
  const card = promptCard(prompt, users);
  const serializedVersions = await serializeVersions(versionRows);
  const contributors = [...new Map(
    serializedVersions
      .filter((version) => version.source === "accepted-improvement" && version.author.id !== card.author.id)
      .map((version) => [version.author.id, version.author]),
  ).values()];
  return {
    ...card,
    kind: "prompt",
    content: prompt.content,
    visibility: prompt.visibility,
    version: prompt.currentVersion,
    versions: serializedVersions,
    contributors,
    forkedFrom: source?.[0] && source[1] ? {
      targetId: id(prompt.forkedFrom?.promptId),
      baseVersionId: id(prompt.forkedFrom?.versionId),
      slug: source[0].slug,
      title: source[0].title,
      versionNumber: source[1].versionNumber,
    } : null,
    viewer,
  };
}

export async function getSkillBySlug(slug: string, viewerId: string | null = null): Promise<SkillDetailDTO | null> {
  await connectToDatabase();
  const visibilityFilter = viewerId && Types.ObjectId.isValid(viewerId)
    ? { $or: [{ visibility: { $in: ["public", "unlisted"] as const } }, { creatorId: viewerId }] }
    : { visibility: { $in: ["public", "unlisted"] as const } };
  const skill = await Skill.findOne({ slug, moderationStatus: "visible", ...visibilityFilter }).lean<RawSkill | null>();
  if (!skill) return null;

  const [users, versionRows, viewer, source] = await Promise.all([
    userMapFor([skill.creatorId]),
    SkillVersion.find({ skillId: id(skill._id) }).sort({ versionNumber: -1 }).lean<RawVersion[]>(),
    getViewerState(viewerId, "Skill", id(skill._id), skill.creatorId),
    skill.forkedFrom?.skillId && skill.forkedFrom?.versionId
      ? Promise.all([
          Skill.findById(skill.forkedFrom.skillId).select("name slug").lean<{ name: string; slug: string } | null>(),
          SkillVersion.findById(skill.forkedFrom.versionId).select("versionNumber").lean<{ versionNumber: number } | null>(),
        ])
      : Promise.resolve(null),
  ]);
  const card = skillCard(skill, users);
  const serializedVersions = await serializeVersions(versionRows);
  const contributors = [...new Map(
    serializedVersions
      .filter((version) => version.source === "accepted-improvement" && version.author.id !== card.author.id)
      .map((version) => [version.author.id, version.author]),
  ).values()];
  return {
    ...card,
    kind: "skill",
    instructions: skill.instructions,
    requiredKnowledge: skill.requiredKnowledge ?? [],
    workflow: (skill.workflow ?? []).map((step) => ({ title: step.title, items: [step.instruction] })),
    tools: skill.tools ?? [],
    dependencies: (skill.dependencies ?? []).map((dependency) => ({
      name: dependency.name,
      slug: "",
      version: dependency.versionRange,
    })),
    visibility: skill.visibility,
    versions: serializedVersions,
    contributors,
    viewer,
    forkedFrom: source?.[0] && source[1] ? {
      targetId: id(skill.forkedFrom?.skillId),
      baseVersionId: id(skill.forkedFrom?.versionId),
      slug: source[0].slug,
      title: source[0].name,
      versionNumber: source[1].versionNumber,
    } : null,
  };
}

export async function getComments(
  targetType: "Prompt" | "Skill",
  targetId: string,
  viewerId: string | null = null,
  limit = 30,
): Promise<CommentDTO[]> {
  if (!Types.ObjectId.isValid(targetId)) return [];
  await connectToDatabase();
  type RawComment = {
    _id: unknown;
    userId: unknown;
    parentId?: unknown | null;
    content: string;
    createdAt: Date;
    editedAt?: Date | null;
    reactionCount?: number;
  };

  const roots = await Comment.find({
    targetType,
    targetId,
    parentId: null,
    status: "visible",
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean<RawComment[]>();
  if (!roots.length) return [];

  const replies = await Comment.find({
    targetType,
    targetId,
    parentId: { $in: roots.map((comment) => new Types.ObjectId(id(comment._id))) },
    status: "visible",
  })
    .sort({ createdAt: 1 })
    .limit(Math.min(limit, 100) * 100)
    .lean<RawComment[]>();
  const comments = [...roots, ...replies];
  const [users, liked] = await Promise.all([
    userMapFor(comments.map((comment) => comment.userId)),
    viewerId
      ? Like.find({ userId: viewerId, targetType: "Comment", targetId: { $in: comments.map((comment) => id(comment._id)) } })
          .select("targetId")
          .lean<Array<{ targetId: unknown }>>()
      : Promise.resolve([]),
  ]);
  const likedIds = new Set(liked.map((item) => id(item.targetId)));
  const serializeComment = (comment: RawComment): CommentDTO => ({
    id: id(comment._id),
    content: comment.content,
    author: users.get(id(comment.userId)) ?? fallbackUser,
    createdAt: date(comment.createdAt),
    editedAt: comment.editedAt ? date(comment.editedAt) : null,
    likes: comment.reactionCount ?? 0,
    isLiked: likedIds.has(id(comment._id)),
    replies: [],
  });
  const repliesByRoot = new Map<string, CommentDTO[]>();
  for (const reply of replies) {
    const rootId = id(reply.parentId);
    const threadReplies = repliesByRoot.get(rootId) ?? [];
    threadReplies.push(serializeComment(reply));
    repliesByRoot.set(rootId, threadReplies);
  }

  return roots.map((root) => ({
    ...serializeComment(root),
    replies: repliesByRoot.get(id(root._id)) ?? [],
  }));
}

export async function getPlatformStats() {
  await connectToDatabase();
  const [prompts, skills, users, improvements] = await Promise.all([
    Prompt.countDocuments({ visibility: "public", moderationStatus: "visible" }),
    Skill.countDocuments({ visibility: "public", moderationStatus: "visible" }),
    User.countDocuments({ accountStatus: "active" }),
    import("@/models/ImprovementRequest").then(({ ImprovementRequest }) =>
      ImprovementRequest.countDocuments({ status: "accepted" }),
    ),
  ]);
  return { prompts, skills, users, improvements };
}
