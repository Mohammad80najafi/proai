"use client";

import { usePathname } from "next/navigation";

import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";

export type AppShellUser = {
  displayName: string;
  username: string;
  avatar?: string | null;
  rank?: string;
};

export function AppShell({
  children,
  user,
  notificationCount = 0,
  messageCount = 0,
}: {
  children: React.ReactNode;
  user?: AppShellUser;
  notificationCount?: number;
  messageCount?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <DesktopSidebar activePath={pathname} user={user} />
      <Topbar
        user={user}
        notificationCount={notificationCount}
        messageCount={messageCount}
        sidebarOffset
      />
      <main className="min-w-0 pb-24 lg:ms-64 lg:pb-10">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          {children}
        </div>
      </main>
      <MobileNav activePath={pathname} />
    </div>
  );
}
