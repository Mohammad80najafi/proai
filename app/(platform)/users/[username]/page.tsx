import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Bookmark, CalendarDays, GitPullRequestArrow, MessageCircle, Shapes, Sparkles, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { PromptCard } from "@/components/ui/prompt-card";
import { SkillCard } from "@/components/ui/skill-card";
import { FollowButton } from "@/features/social/follow-button";
import { getProfile } from "@/features/social/data";
import { getOptionalUser } from "@/lib/auth/dal";
import { formatDate, formatNumber } from "@/lib/format";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> { const { username } = await params; const profile = await getProfile(username).catch(() => null); return profile ? { title: profile.user.displayName, description: profile.user.bio } : { title: "پروفایل" }; }

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const viewer = await getOptionalUser().catch(() => null);
  const profile = await getProfile(username, viewer?.id).catch(() => null);
  if (!profile) notFound();
  return (
    <div className="space-y-8">
      <Card className="surface-noise overflow-hidden"><div className="h-28 border-b border-white/[0.06] bg-[radial-gradient(circle_at_80%_0%,rgba(124,134,255,.18),transparent_45%)] sm:h-36" /><div className="px-5 pb-6 sm:px-8"><div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end"><Avatar src={profile.user.avatar} fallback={profile.user.displayName} alt={profile.user.displayName} size="xl" className="ring-4 ring-[#0d121e]" /><div className="min-w-0 flex-1 sm:pb-1"><h1 className="text-2xl font-bold sm:text-3xl">{profile.user.displayName}</h1><p className="mt-1 text-xs text-faint" dir="ltr">@{profile.user.username}</p></div><div className="flex flex-wrap gap-2">{profile.isOwnProfile ? <ButtonLink href="/saved" variant="outline"><Bookmark className="size-4" />ذخیره‌ها</ButtonLink> : null}{!profile.isOwnProfile ? <FollowButton userId={profile.user.id} initialFollowing={profile.isFollowing} /> : <ButtonLink href="/settings" variant="secondary">ویرایش پروفایل</ButtonLink>}{!profile.isOwnProfile && viewer ? <ButtonLink href={`/messages/new?user=${profile.user.username}`} variant="outline"><MessageCircle className="size-4" />پیام</ButtonLink> : null}</div></div><p className="mt-5 max-w-2xl text-sm leading-8 text-muted">{profile.user.bio || "هنوز توضیحی برای این پروفایل نوشته نشده است."}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-faint"><Link href={`/users/${profile.user.username}/connections?tab=followers`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 outline-none transition hover:bg-white/[0.05] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70"><Users className="size-4" />{formatNumber(profile.user.stats.followers)} دنبال‌کننده</Link><Link href={`/users/${profile.user.username}/connections?tab=following`} className="rounded-lg px-2 py-1 outline-none transition hover:bg-white/[0.05] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-400/70">{formatNumber(profile.user.stats.following)} دنبال‌شده</Link><span className="flex items-center gap-1.5 px-2"><CalendarDays className="size-4" />عضویت از {formatDate(profile.user.createdAt)}</span></div></div></Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="امتیاز مشارکت" value={formatNumber(profile.user.reputationScore)} icon={<Sparkles />} /><Metric label="پرامپت" value={formatNumber(profile.user.stats.prompts)} /><Metric label="مهارت" value={formatNumber(profile.user.stats.skills)} icon={<Shapes />} /><Metric label="بهبود پذیرفته‌شده" value={formatNumber(profile.user.stats.acceptedImprovements)} icon={<GitPullRequestArrow />} /></div>
      {profile.achievements.length ? <section><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Award className="size-5 text-warning" />دستاوردها</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{profile.achievements.map((achievement) => <Card key={achievement.id} className="flex gap-3 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-lg">{achievement.icon}</div><div><h3 className="text-sm font-semibold">{achievement.name}</h3><p className="mt-1 text-xs leading-5 text-muted">{achievement.description}</p></div></Card>)}</div></section> : null}
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">پرامپت‌ها</h2><span className="text-xs text-faint">{profile.prompts.length.toLocaleString("fa-IR")} اثر عمومی</span></div>{profile.prompts.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{profile.prompts.map((prompt) => <PromptCard key={prompt.id} id={prompt.slug} href={`/prompts/${prompt.slug}`} title={prompt.title} description={prompt.description} images={prompt.images} author={prompt.author} category={prompt.category} tags={prompt.tags} version={prompt.version} stats={{ likes: prompt.stats.likes, saves: prompt.stats.saves, forks: prompt.stats.forks, rating: prompt.stats.ratingAverage }} />)}</div> : <Card className="p-8 text-center text-sm text-faint">هنوز پرامپت عمومی ندارد.</Card>}</section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">مهارت‌ها</h2><span className="text-xs text-faint">{profile.skills.length.toLocaleString("fa-IR")} مهارت عمومی</span></div>{profile.skills.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{profile.skills.map((skill) => <SkillCard key={skill.id} id={skill.slug} href={`/skills/${skill.slug}`} name={skill.title} description={skill.description} images={skill.images} creator={skill.author} modules={skill.tags} forks={skill.stats.forks} rating={skill.stats.ratingAverage} version={skill.version} />)}</div> : <Card className="p-8 text-center text-sm text-faint">هنوز مهارت عمومی ندارد.</Card>}</section>
    </div>
  );
}
