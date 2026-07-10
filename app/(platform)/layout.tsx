import { AppShell } from "@/components/layout/app-shell";
import { getOptionalUser } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser().catch(() => null);
  return (
    <AppShell
      user={user ? {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        rank: user.rank,
      } : undefined}
    >
      {children}
    </AppShell>
  );
}
