"use client";

import { usePathname } from "next/navigation";

import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { mobileNavigation, primaryNavigation } from "@/components/layout/navigation";
import { RealtimeProvider, useRealtime } from "@/features/chat/realtime-provider";

export type AppShellUser = {
  displayName: string;
  username: string;
  avatar?: string | null;
  rank?: string;
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
  const messageCount = user ? unreadConversationCount : 0;
  const visibleNotificationCount = user ? notificationCount : 0;
  const desktopItems = primaryNavigation.map((item) =>
    item.href === "/messages"
      ? { ...item, badge: messageCount || undefined }
      : item,
  );
  const mobileItems = mobileNavigation.map((item) =>
    item.href === "/messages"
      ? { ...item, badge: messageCount || undefined }
      : item,
  );

  return (
    <div className="min-h-screen">
      <DesktopSidebar activePath={pathname} items={desktopItems} user={user} />
      <Topbar
        user={user}
        notificationCount={visibleNotificationCount}
        messageCount={messageCount}
        sidebarOffset
      />
      <main className="min-w-0 pb-24 lg:ms-64 lg:pb-10">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          {children}
        </div>
      </main>
      <MobileNav activePath={pathname} items={mobileItems} />
    </div>
  );
}
