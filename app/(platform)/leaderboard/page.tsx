import { PageHeader } from "@/components/layout/page-header";
import { UserCard } from "@/components/ui/user-card";
import { getLeaderboard } from "@/features/social/data";
import { REPUTATION_RANKS } from "@/lib/constants";

export const metadata = { title: "برترین مشارکت‌کنندگان" };

export default async function LeaderboardPage() { const users = await getLeaderboard().catch(() => []); return <div className="space-y-7"><PageHeader eyebrow="اعتبار جامعه" title="برترین مشارکت‌کنندگان" description="سازندگانی که با انتشار دانش و بهبود آثار دیگران بیشترین ارزش را ایجاد کرده‌اند." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{users.map((user) => <UserCard key={String(user._id)} username={user.username} displayName={user.displayName} avatar={user.avatar} bio={user.bio} rank={REPUTATION_RANKS.find((rank) => rank.key === user.rank)?.label} contributionScore={user.reputationScore} followers={user.stats?.followers} prompts={user.stats?.prompts} skills={user.stats?.skills} />)}</div></div>; }
