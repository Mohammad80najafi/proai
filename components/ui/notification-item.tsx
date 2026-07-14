import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AtSign,
  Check,
  GitPullRequestArrow,
  Heart,
  MessageCircle,
  RefreshCw,
  UserPlus,
  X,
} from "lucide-react";

import { Avatar } from "./avatar";
import { cn } from "./cn";

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "mention"
  | "proposal"
  | "update"
  | "message"
  | "accepted"
  | "rejected";

const notificationStyles: Record<
  NotificationType,
  { icon: LucideIcon; color: string; label: string }
> = {
  follow: { icon: UserPlus, color: "bg-sky-400/10 text-sky-300", label: "دنبال‌کردن" },
  like: { icon: Heart, color: "bg-rose-400/10 text-rose-300", label: "پسند" },
  comment: {
    icon: MessageCircle,
    color: "bg-violet-400/10 text-violet-300",
    label: "دیدگاه",
  },
  mention: { icon: AtSign, color: "bg-indigo-400/10 text-indigo-300", label: "اشاره" },
  proposal: {
    icon: GitPullRequestArrow,
    color: "bg-orange-400/10 text-orange-300",
    label: "پیشنهاد بهبود",
  },
  update: {
    icon: RefreshCw,
    color: "bg-cyan-400/10 text-cyan-300",
    label: "نسخه تازه",
  },
  message: {
    icon: MessageCircle,
    color: "bg-blue-400/10 text-blue-300",
    label: "پیام",
  },
  accepted: { icon: Check, color: "bg-emerald-400/10 text-emerald-300", label: "پذیرفته شد" },
  rejected: { icon: X, color: "bg-red-400/10 text-red-300", label: "رد شد" },
};

export interface NotificationItemProps {
  type: NotificationType;
  title: string;
  description?: string;
  timestamp: string;
  href?: string;
  unread?: boolean;
  actor?: {
    name: string;
    avatar?: string | null;
  };
  className?: string;
}

export function NotificationItem({
  type,
  title,
  description,
  timestamp,
  href,
  unread = false,
  actor,
  className,
}: NotificationItemProps) {
  const style = notificationStyles[type];
  const Icon = style.icon;
  const content = (
    <>
      <div className="relative shrink-0">
        {actor ? (
          <Avatar src={actor.avatar} alt={actor.name} fallback={actor.name} size="md" />
        ) : (
          <span className={cn("grid size-10 place-items-center rounded-full", style.color)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        {actor ? (
          <span
            className={cn(
              "absolute -bottom-1 -end-1 grid size-5 place-items-center rounded-full border-2 border-[#0d121e]",
              style.color,
            )}
            title={style.label}
          >
            <Icon className="size-2.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-6 text-slate-200" dir="auto">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500" dir="auto">
            {description}
          </span>
        ) : null}
        <span className="mt-1.5 block text-[10px] text-slate-600">{timestamp}</span>
      </span>
      {unread ? (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.08)]">
          <span className="sr-only">خوانده‌نشده</span>
        </span>
      ) : null}
    </>
  );
  const classes = cn(
    "flex items-start gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-indigo-400/70 motion-reduce:transition-none",
    unread && "bg-indigo-400/[0.035]",
    className,
  );

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
