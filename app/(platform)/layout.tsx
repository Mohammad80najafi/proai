import { AppShell } from "@/components/layout/app-shell";
import { getUnreadConversationIds } from "@/features/chat/data";
import { getUnreadNotificationCount } from "@/features/social/data";
import { getOptionalUser } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser().catch(() => null);
  const [initialUnreadConversationIds, initialNotificationCount] = user
    ? await Promise.all([
        getUnreadConversationIds(user.id).catch(() => []),
        getUnreadNotificationCount(user.id).catch(() => 0),
      ])
    : [[], 0];

  return (
    <AppShell
      initialUnreadConversationIds={initialUnreadConversationIds}
      initialNotificationCount={initialNotificationCount}
      user={user ? {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        rank: user.rank,
        roles: user.roles,
      } : undefined}
    >
      {children}
    </AppShell>
  );
}
