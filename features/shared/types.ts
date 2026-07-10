export type ContentKind = "prompt" | "skill";
export type Visibility = "draft" | "public" | "unlisted";

export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  rank: string;
  reputationScore: number;
};

export type ContentStats = {
  likes: number;
  saves: number;
  comments: number;
  forks: number;
  ratingAverage: number;
  ratingCount: number;
};

export type ContentCardDTO = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  author: UserSummary;
  stats: ContentStats;
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
};

export type VersionDTO = {
  id: string;
  versionNumber: number;
  content: string;
  changes: string;
  author: UserSummary;
  createdAt: string;
};

export type PromptDetailDTO = ContentCardDTO & {
  kind: "prompt";
  content: string;
  visibility: Visibility;
  versions: VersionDTO[];
  forkedFrom?: {
    targetId: string;
    baseVersionId: string;
    slug: string;
    title: string;
    versionNumber: number;
  } | null;
  viewer: ViewerState;
};

export type SkillSection = {
  title: string;
  items: string[];
};

export type SkillDetailDTO = ContentCardDTO & {
  kind: "skill";
  instructions: string;
  requiredKnowledge: string[];
  workflow: SkillSection[];
  tools: string[];
  dependencies: Array<{ name: string; slug: string; version: string }>;
  visibility: Visibility;
  versions: VersionDTO[];
  viewer: ViewerState;
  forkedFrom?: {
    targetId: string;
    baseVersionId: string;
    slug: string;
    title: string;
    versionNumber: number;
  } | null;
};

export type ViewerState = {
  isAuthenticated: boolean;
  isOwner: boolean;
  hasLiked: boolean;
  hasSaved: boolean;
  rating: number | null;
};

export type CommentDTO = {
  id: string;
  content: string;
  author: UserSummary;
  createdAt: string;
  editedAt: string | null;
  likes: number;
  isLiked: boolean;
};

export type ImprovementStatus =
  | "draft"
  | "open"
  | "changes_requested"
  | "accepted"
  | "rejected"
  | "closed";

export type ImprovementRequestDTO = {
  id: string;
  number: number;
  kind: ContentKind;
  title: string;
  summary: string;
  proposedContent: string;
  baseVersionNumber: number;
  status: ImprovementStatus;
  author: UserSummary;
  owner: UserSummary;
  target: { slug: string; title: string };
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NotificationDTO = {
  id: string;
  type: "follow" | "like" | "comment" | "mention" | "improvement" | "message" | "achievement";
  actor: UserSummary | null;
  title: string;
  description: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export type ConversationDTO = {
  id: string;
  participant: UserSummary;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  online: boolean;
  context?: {
    kind: ContentKind | "improvement";
    title: string;
    href: string;
  };
};
