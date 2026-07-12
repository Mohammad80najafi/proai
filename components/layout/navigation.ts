import type { LucideIcon } from "lucide-react";
import {
  Compass,
  GitPullRequestArrow,
  Home,
  MessageCircle,
  UserRound,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  exact?: boolean;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "خانه", href: "/", icon: Home, exact: true },
  { label: "کاوش", href: "/explore", icon: Compass },
  {
    label: "پیشنهادهای بهبود",
    href: "/improvements",
    icon: GitPullRequestArrow,
  },
  { label: "پیام‌ها", href: "/messages", icon: MessageCircle },
];

export const mobileNavigation: NavigationItem[] = [
  { label: "خانه", href: "/", icon: Home, exact: true },
  { label: "کاوش", href: "/explore", icon: Compass },
  { label: "بهبودها", href: "/improvements", icon: GitPullRequestArrow },
  { label: "پیام‌ها", href: "/messages", icon: MessageCircle },
  { label: "پروفایل", href: "/profile", icon: UserRound },
];

export function isNavigationItemActive(item: NavigationItem, activePath?: string) {
  if (!activePath) return false;
  if (item.exact || item.href === "/") return activePath === item.href;
  return activePath === item.href || activePath.startsWith(`${item.href}/`);
}
