import { notFound } from "next/navigation";
import { UserCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { UserCard } from "@/components/ui/user-card";
import { FollowButton } from "@/features/social/follow-button";
import { getUserConnections } from "@/features/social/data";
import { getOptionalUser } from "@/lib/auth/dal";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export const metadata = { title: "ارتباط‌ها" };

export default async function UserConnectionsPage({ params, searchParams }: Props) {
  const [{ username }, query, viewer] = await Promise.all([
    params,
    searchParams,
    getOptionalUser().catch(() => null),
  ]);
  const mode = query.tab === "following" ? "following" : "followers";
  const data = await getUserConnections(username, mode, viewer?.id).catch(() => null);
  if (!data) notFound();

  const title = mode === "followers" ? "دنبال‌کنندگان" : "دنبال‌شده‌ها";
  const description = mode === "followers"
    ? `افرادی که ${data.profile.displayName} را دنبال می‌کنند.`
    : `افرادی که ${data.profile.displayName} دنبال می‌کند.`;

  return (
    <div className="space-y-7">
      <PageHeader
        breadcrumbs={[
          { label: data.profile.displayName, href: `/users/${data.profile.username}` },
          { label: title },
        ]}
        eyebrow={<span className="inline-flex items-center gap-2"><Users className="size-4" />شبکه کاربران</span>}
        title={title}
        description={description}
      />

      <Tabs
        activeKey={mode}
        items={[
          {
            key: "followers",
            label: "دنبال‌کنندگان",
            href: `/users/${data.profile.username}/connections?tab=followers`,
            icon: <Users />,
            count: data.profile.stats.followers,
          },
          {
            key: "following",
            label: "دنبال‌شده‌ها",
            href: `/users/${data.profile.username}/connections?tab=following`,
            icon: <UserCheck />,
            count: data.profile.stats.following,
          },
        ]}
      />

      {data.users.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.users.map((user) => (
            <UserCard
              key={user.id}
              username={user.username}
              displayName={user.displayName}
              avatar={user.avatar}
              bio={user.bio}
              contributionScore={user.reputationScore}
              followers={user.stats.followers}
              prompts={user.stats.prompts}
              skills={user.stats.skills}
              action={viewer && !user.isSelf ? (
                <FollowButton userId={user.id} initialFollowing={user.isFollowing} fullWidth />
              ) : undefined}
            />
          ))}
        </div>
      ) : (
        <Card className="grid min-h-64 place-items-center p-8 text-center">
          <div>
            <Users className="mx-auto size-9 text-faint" />
            <h2 className="mt-4 font-semibold">این فهرست هنوز خالی است</h2>
            <p className="mt-2 text-sm text-muted">
              {mode === "followers" ? "هنوز کسی این کاربر را دنبال نکرده است." : "این کاربر هنوز کسی را دنبال نمی‌کند."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
