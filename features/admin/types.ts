export type AdminSection = "overview" | "users" | "content" | "news" | "reports";

export type AdminMetric = {
  key: string;
  label: string;
  value: number;
  helper: string;
  tone: "neutral" | "good" | "warning" | "danger";
};

export type AdminActivityPoint = {
  key: string;
  label: string;
  users: number;
  content: number;
  total: number;
};

export type AdminUserRow = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  roles: string[];
  accountStatus: "active" | "suspended" | "deleted";
  rank: string;
  reputationScore: number;
  prompts: number;
  skills: number;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AdminContentRow = {
  id: string;
  type: "Prompt" | "Skill";
  title: string;
  slug: string;
  authorName: string;
  authorUsername: string;
  moderationStatus: "visible" | "under-review" | "removed";
  visibility: "draft" | "public" | "unlisted";
  comments: number;
  likes: number;
  createdAt: string;
};

export type AdminReportRow = {
  id: string;
  reporterName: string;
  reporterUsername: string;
  targetModel: string;
  targetLabel: string;
  reason: string;
  details: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolution: string;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  moderatorName: string;
  action: string;
  targetModel: string;
  note: string;
  createdAt: string;
};

export type AdminNewsRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  source: string;
  coverImage: string;
  status: "draft" | "published";
  featured: boolean;
  managed: boolean;
  dateFull: string;
};
