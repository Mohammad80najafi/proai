import "server-only";

import { Types, type QueryFilter } from "mongoose";

import { requireRole } from "@/lib/auth/dal";
import { connectToDatabase } from "@/lib/db";
import { getNewsStories } from "@/features/news/data";
import { Comment } from "@/models/Comment";
import { ModerationAction, Report, type ReportDocument } from "@/models/Moderation";
import { Prompt, type PromptDocument } from "@/models/Prompt";
import { Session } from "@/models/Session";
import { Skill, type SkillDocument } from "@/models/Skill";
import { User, type UserDocument } from "@/models/User";

import type {
  AdminActivityPoint,
  AdminAuditRow,
  AdminContentRow,
  AdminMetric,
  AdminNewsRow,
  AdminReportRow,
  AdminUserRow,
} from "./types";

type CountPoint = { _id: string; count: number };

function id(value: unknown) {
  return String(value ?? "");
}

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function countByDay(model: typeof User | typeof Prompt | typeof Skill, start: Date) {
  return model.aggregate<CountPoint>([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function activityForLastTwoWeeks(): Promise<AdminActivityPoint[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 13);

  const [userPoints, promptPoints, skillPoints] = await Promise.all([
    countByDay(User, start),
    countByDay(Prompt, start),
    countByDay(Skill, start),
  ]);
  const users = new Map(userPoints.map((point) => [point._id, point.count]));
  const content = new Map<string, number>();
  for (const point of [...promptPoints, ...skillPoints]) {
    content.set(point._id, (content.get(point._id) ?? 0) + point.count);
  }

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = dayKey(date);
    const userCount = users.get(key) ?? 0;
    const contentCount = content.get(key) ?? 0;
    return {
      key,
      label: new Intl.DateTimeFormat("fa-IR", { weekday: "short" }).format(date),
      users: userCount,
      content: contentCount,
      total: userCount + contentCount,
    };
  });
}

export async function getAdminOverview() {
  await requireRole("admin");
  await connectToDatabase();

  const now = new Date();
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    promptCount,
    skillCount,
    commentCount,
    openReports,
    underReviewPrompts,
    underReviewSkills,
    activeSessions,
    activity,
    recentUserRows,
    auditRows,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ accountStatus: "active" }),
    User.countDocuments({ accountStatus: "suspended" }),
    Prompt.countDocuments(),
    Skill.countDocuments(),
    Comment.countDocuments({ status: { $ne: "deleted" } }),
    Report.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    Prompt.countDocuments({ moderationStatus: "under-review" }),
    Skill.countDocuments({ moderationStatus: "under-review" }),
    Session.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
    activityForLastTwoWeeks(),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username displayName avatar roles accountStatus rank reputationScore stats createdAt lastSeenAt")
      .lean<Array<Record<string, unknown>>>(),
    ModerationAction.find()
      .sort({ createdAt: -1 })
      .limit(7)
      .select("moderatorId targetModel action note createdAt")
      .lean<Array<Record<string, unknown>>>(),
  ]);

  const moderatorIds = auditRows.map((row) => row.moderatorId).filter(Boolean);
  const moderators = moderatorIds.length
    ? await User.find({ _id: { $in: moderatorIds } })
        .select("displayName")
        .lean<Array<{ _id: unknown; displayName: string }>>()
    : [];
  const moderatorMap = new Map(moderators.map((user) => [id(user._id), user.displayName]));

  const metrics: AdminMetric[] = [
    {
      key: "users",
      label: "اعضای جامعه",
      value: totalUsers,
      helper: `${activeUsers.toLocaleString("fa-IR")} حساب فعال`,
      tone: "neutral",
    },
    {
      key: "content",
      label: "محتوای ثبت‌شده",
      value: promptCount + skillCount,
      helper: `${promptCount.toLocaleString("fa-IR")} پرامپت · ${skillCount.toLocaleString("fa-IR")} مهارت`,
      tone: "good",
    },
    {
      key: "queue",
      label: "صف بررسی",
      value: openReports + underReviewPrompts + underReviewSkills,
      helper: `${openReports.toLocaleString("fa-IR")} گزارش باز`,
      tone: openReports ? "warning" : "good",
    },
    {
      key: "sessions",
      label: "نشست‌های فعال",
      value: activeSessions,
      helper: `${suspendedUsers.toLocaleString("fa-IR")} حساب تعلیق‌شده`,
      tone: suspendedUsers ? "danger" : "neutral",
    },
  ];

  const recentUsers: AdminUserRow[] = recentUserRows.map((row) => {
    const stats = (row.stats ?? {}) as Record<string, number>;
    return {
      id: id(row._id),
      username: String(row.username ?? ""),
      displayName: String(row.displayName ?? ""),
      avatar: typeof row.avatar === "string" ? row.avatar : null,
      roles: Array.isArray(row.roles) ? row.roles.map(String) : ["user"],
      accountStatus: row.accountStatus === "suspended" || row.accountStatus === "deleted"
        ? row.accountStatus
        : "active",
      rank: String(row.rank ?? "beginner"),
      reputationScore: Number(row.reputationScore ?? 0),
      prompts: stats.prompts ?? 0,
      skills: stats.skills ?? 0,
      createdAt: iso(row.createdAt as Date) ?? new Date(0).toISOString(),
      lastSeenAt: iso(row.lastSeenAt as Date | null),
    };
  });
  const recentActions: AdminAuditRow[] = auditRows.map((row) => ({
    id: id(row._id),
    moderatorName: moderatorMap.get(id(row.moderatorId)) ?? "مدیر",
    action: String(row.action ?? ""),
    targetModel: String(row.targetModel ?? ""),
    note: String(row.note ?? ""),
    createdAt: iso(row.createdAt as Date) ?? new Date(0).toISOString(),
  }));

  return {
    metrics,
    activity,
    recentUsers,
    recentActions,
    totals: { commentCount, openReports, underReview: underReviewPrompts + underReviewSkills },
  };
}

export async function getAdminUsers(params: { query?: string; status?: string }) {
  await requireRole("admin");
  await connectToDatabase();
  const query = params.query?.trim().slice(0, 80) ?? "";
  const status = ["active", "suspended", "deleted"].includes(params.status ?? "")
    ? (params.status as AdminUserRow["accountStatus"])
    : undefined;
  const filter: QueryFilter<UserDocument> = status ? { accountStatus: status } : {};
  if (query) {
    filter.$or = [
      { username: { $regex: escapeRegex(query), $options: "i" } },
      { displayName: { $regex: escapeRegex(query), $options: "i" } },
    ];
  }
  const [rows, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("username displayName avatar roles accountStatus rank reputationScore stats createdAt lastSeenAt")
      .lean<Array<Record<string, unknown>>>(),
    User.countDocuments(filter),
  ]);
  const users: AdminUserRow[] = rows.map((row) => {
    const stats = (row.stats ?? {}) as Record<string, number>;
    return {
      id: id(row._id),
      username: String(row.username ?? ""),
      displayName: String(row.displayName ?? ""),
      avatar: typeof row.avatar === "string" ? row.avatar : null,
      roles: Array.isArray(row.roles) ? row.roles.map(String) : ["user"],
      accountStatus: row.accountStatus === "suspended" || row.accountStatus === "deleted"
        ? row.accountStatus
        : "active",
      rank: String(row.rank ?? "beginner"),
      reputationScore: Number(row.reputationScore ?? 0),
      prompts: stats.prompts ?? 0,
      skills: stats.skills ?? 0,
      createdAt: iso(row.createdAt as Date) ?? new Date(0).toISOString(),
      lastSeenAt: iso(row.lastSeenAt as Date | null),
    };
  });
  return { users, total };
}

export async function getAdminContent(params: {
  query?: string;
  status?: string;
  type?: string;
}) {
  await requireRole("admin");
  await connectToDatabase();
  const query = params.query?.trim().slice(0, 100) ?? "";
  const status = ["visible", "under-review", "removed"].includes(params.status ?? "")
    ? (params.status as AdminContentRow["moderationStatus"])
    : undefined;
  const type = params.type === "Prompt" || params.type === "Skill" ? params.type : undefined;
  const promptFilter: QueryFilter<PromptDocument> = status ? { moderationStatus: status } : {};
  const skillFilter: QueryFilter<SkillDocument> = status ? { moderationStatus: status } : {};
  if (query) {
    const pattern = { $regex: escapeRegex(query), $options: "i" };
    promptFilter.$or = [{ title: pattern }, { slug: pattern }];
    skillFilter.$or = [{ name: pattern }, { slug: pattern }];
  }

  const [promptRows, skillRows, promptTotal, skillTotal] = await Promise.all([
    type === "Skill"
      ? Promise.resolve([])
      : Prompt.find(promptFilter)
          .sort({ createdAt: -1 })
          .limit(50)
          .select("title slug creatorId moderationStatus visibility stats createdAt")
          .lean<Array<Record<string, unknown>>>(),
    type === "Prompt"
      ? Promise.resolve([])
      : Skill.find(skillFilter)
          .sort({ createdAt: -1 })
          .limit(50)
          .select("name slug creatorId moderationStatus visibility stats createdAt")
          .lean<Array<Record<string, unknown>>>(),
    type === "Skill" ? Promise.resolve(0) : Prompt.countDocuments(promptFilter),
    type === "Prompt" ? Promise.resolve(0) : Skill.countDocuments(skillFilter),
  ]);
  const creatorIds = [...promptRows, ...skillRows].map((row) => row.creatorId).filter(Boolean);
  const creators = creatorIds.length
    ? await User.find({ _id: { $in: creatorIds } })
        .select("username displayName")
        .lean<Array<{ _id: unknown; username: string; displayName: string }>>()
    : [];
  const creatorMap = new Map(creators.map((user) => [id(user._id), user]));

  const serialize = (row: Record<string, unknown>, rowType: "Prompt" | "Skill"): AdminContentRow => {
    const creator = creatorMap.get(id(row.creatorId));
    const stats = (row.stats ?? {}) as Record<string, number>;
    return {
      id: id(row._id),
      type: rowType,
      title: String(rowType === "Prompt" ? row.title : row.name),
      slug: String(row.slug ?? ""),
      authorName: creator?.displayName ?? "کاربر حذف‌شده",
      authorUsername: creator?.username ?? "deleted-user",
      moderationStatus: row.moderationStatus === "under-review" || row.moderationStatus === "removed"
        ? row.moderationStatus
        : "visible",
      visibility: row.visibility === "public" || row.visibility === "unlisted"
        ? row.visibility
        : "draft",
      comments: stats.comments ?? 0,
      likes: stats.likes ?? 0,
      createdAt: iso(row.createdAt as Date) ?? new Date(0).toISOString(),
    };
  };
  const content = [
    ...promptRows.map((row) => serialize(row, "Prompt")),
    ...skillRows.map((row) => serialize(row, "Skill")),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  return { content, total: promptTotal + skillTotal };
}

export async function getAdminReports(params: { status?: string; query?: string }) {
  await requireRole("admin");
  await connectToDatabase();
  const status = ["open", "reviewing", "resolved", "dismissed"].includes(params.status ?? "")
    ? (params.status as AdminReportRow["status"])
    : undefined;
  const query = params.query?.trim().slice(0, 100) ?? "";
  const filter: QueryFilter<ReportDocument> = status ? { status } : {};
  if (query) filter.details = { $regex: escapeRegex(query), $options: "i" };
  const [rows, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("reporterId targetModel targetId reason details status resolution createdAt")
      .lean<Array<Record<string, unknown>>>(),
    Report.countDocuments(filter),
  ]);
  const reporterIds = rows.map((row) => row.reporterId).filter(Boolean);
  const reporters = reporterIds.length
    ? await User.find({ _id: { $in: reporterIds } })
        .select("username displayName")
        .lean<Array<{ _id: unknown; username: string; displayName: string }>>()
    : [];
  const reporterMap = new Map(reporters.map((user) => [id(user._id), user]));

  const targetIds = (model: string) =>
    rows.filter((row) => row.targetModel === model).map((row) => new Types.ObjectId(id(row.targetId)));
  const [targetUsers, targetPrompts, targetSkills, targetComments] = await Promise.all([
    User.find({ _id: { $in: targetIds("User") } }).select("displayName username").lean<Array<Record<string, unknown>>>(),
    Prompt.find({ _id: { $in: targetIds("Prompt") } }).select("title").lean<Array<Record<string, unknown>>>(),
    Skill.find({ _id: { $in: targetIds("Skill") } }).select("name").lean<Array<Record<string, unknown>>>(),
    Comment.find({ _id: { $in: targetIds("Comment") } }).select("content").lean<Array<Record<string, unknown>>>(),
  ]);
  const targetLabels = new Map<string, string>();
  for (const row of targetUsers) targetLabels.set(id(row._id), `${String(row.displayName)} (@${String(row.username)})`);
  for (const row of targetPrompts) targetLabels.set(id(row._id), String(row.title));
  for (const row of targetSkills) targetLabels.set(id(row._id), String(row.name));
  for (const row of targetComments) targetLabels.set(id(row._id), String(row.content).slice(0, 100));

  const reports: AdminReportRow[] = rows.map((row) => {
    const reporter = reporterMap.get(id(row.reporterId));
    return {
      id: id(row._id),
      reporterName: reporter?.displayName ?? "کاربر حذف‌شده",
      reporterUsername: reporter?.username ?? "deleted-user",
      targetModel: String(row.targetModel ?? ""),
      targetLabel: targetLabels.get(id(row.targetId)) ?? `شناسه ${id(row.targetId).slice(-8)}`,
      reason: String(row.reason ?? "other"),
      details: String(row.details ?? ""),
      status: row.status as AdminReportRow["status"],
      resolution: String(row.resolution ?? ""),
      createdAt: iso(row.createdAt as Date) ?? new Date(0).toISOString(),
    };
  });
  return { reports, total };
}

export async function getAdminNews(params: { query?: string; status?: string }) {
  await requireRole("admin");
  const query = params.query?.trim().toLocaleLowerCase("fa-IR") ?? "";
  const status = params.status === "draft" || params.status === "published"
    ? params.status
    : undefined;
  const stories = await getNewsStories({ includeDrafts: true });
  const news: AdminNewsRow[] = stories
    .filter((story) => !status || story.status === status)
    .filter((story) => !query || [story.title, story.slug, story.source, story.category].some((value) => value.toLocaleLowerCase("fa-IR").includes(query)))
    .map((story) => ({
      id: story.id,
      slug: story.slug,
      title: story.title,
      category: story.category,
      source: story.source,
      coverImage: story.coverImage,
      status: story.status ?? "published",
      featured: Boolean(story.featured),
      managed: Boolean(story.managed),
      dateFull: story.dateFull,
    }));
  return { news, total: news.length };
}
