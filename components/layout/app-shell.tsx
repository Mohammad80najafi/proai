"use client";

import { usePathname } from "next/navigation";

import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import {
  adminNavigationItem,
  mobileNavigation,
  primaryNavigation,
} from "@/components/layout/navigation";
import { cn } from "@/components/ui/cn";
import { RealtimeProvider, useRealtime } from "@/features/chat/realtime-provider";

export type AppShellUser = {
  displayName: string;
  username: string;
  avatar?: string | null;
  rank?: string;
  roles?: readonly string[];
};

export function AppShell({
  children,
  user,
  initialUnreadConversationIds = [],
  initialNotificationCount = 0,
}: {
  children: React.ReactNode;
  user?: AppShellUser;
  initialUnreadConversationIds?: string[];
  initialNotificationCount?: number;
}) {
  return (
    <RealtimeProvider
      enabled={Boolean(user)}
      initialUnreadConversationIds={initialUnreadConversationIds}
      initialNotificationCount={initialNotificationCount}
    >
      <AppShellContent user={user}>{children}</AppShellContent>
    </RealtimeProvider>
  );
}

function AppShellContent({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: AppShellUser;
}) {
  const pathname = usePathname();
  const { unreadConversationCount, notificationCount } = useRealtime();
  const messagesWorkspace = pathname === "/messages";
  const messageCount = user ? unreadConversationCount : 0;
  const visibleNotificationCount = user ? notificationCount : 0;
  const isAdmin = user?.roles?.includes("admin") ?? false;
  const roleAwareDesktopItems = isAdmin
    ? [...primaryNavigation, adminNavigationItem]
    : primaryNavigation;
  const roleAwareMobileItems = isAdmin
    ? [...mobileNavigation.slice(0, -1), adminNavigationItem]
    : mobileNavigation;
  const desktopItems = roleAwareDesktopItems.map((item) =>
    item.href === "/messages"
      ? { ...item, badge: messageCount || undefined }
      : item,
  );
  const mobileItems = roleAwareMobileItems.map((item) =>
    item.href === "/messages"
      ? { ...item, badge: messageCount || undefined }
      : item,
  );

  return (
    <div className={cn("min-h-screen", messagesWorkspace && "h-dvh overflow-hidden")}>
      <DesktopSidebar activePath={pathname} items={desktopItems} user={user} />
      <Topbar
        user={user}
        notificationCount={visibleNotificationCount}
        messageCount={messageCount}
        sidebarOffset
      />
      <main
        className={cn(
          "min-w-0 lg:ms-64",
          messagesWorkspace
            ? "h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom))] overflow-hidden lg:h-[calc(100dvh-4rem)]"
            : "pb-24 lg:pb-10",
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            messagesWorkspace
              ? "h-full max-w-none p-2 sm:p-3 lg:p-4 xl:p-5"
              : "max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8",
          )}
        >
          {children}
        </div>
      </main>
      <MobileNav activePath={pathname} items={mobileItems} />
    </div>
  );
}
