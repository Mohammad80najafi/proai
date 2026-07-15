import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, GitPullRequestArrow, Shapes, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { PromptCard } from "@/components/ui/prompt-card";
import { SkillCard } from "@/components/ui/skill-card";
import { getProfile } from "@/features/social/data";
import { ProfileHeader } from "@/features/social/profile-header";
import { getOptionalUser } from "@/lib/auth/dal";
import { formatNumber } from "@/lib/format";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> { const { username } = await params; const profile = await getProfile(username).catch(() => null); return profile ? { title: profile.user.displayName, description: profile.user.bio } : { title: "پروفایل" }; }

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const viewer = await getOptionalUser().catch(() => null);
  const profile = await getProfile(username, viewer?.id).catch(() => null);
  if (!profile) notFound();
  return (
    <div className="space-y-8">
      <ProfileHeader
        user={profile.user}
        isOwnProfile={profile.isOwnProfile}
        isFollowing={profile.isFollowing}
        canMessage={!profile.isOwnProfile && Boolean(viewer)}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="امتیاز مشارکت" value={formatNumber(profile.user.reputationScore)} icon={<Sparkles />} /><Metric label="پرامپت" value={formatNumber(profile.user.stats.prompts)} /><Metric label="مهارت" value={formatNumber(profile.user.stats.skills)} icon={<Shapes />} /><Metric label="بهبود پذیرفته‌شده" value={formatNumber(profile.user.stats.acceptedImprovements)} icon={<GitPullRequestArrow />} /></div>
      {profile.achievements.length ? <section><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Award className="size-5 text-warning" />دستاوردها</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{profile.achievements.map((achievement) => <Card key={achievement.id} className="flex gap-3 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-lg">{achievement.icon}</div><div><h3 className="text-sm font-semibold">{achievement.name}</h3><p className="mt-1 text-xs leading-5 text-muted">{achievement.description}</p></div></Card>)}</div></section> : null}
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">پرامپت‌ها</h2><span className="text-xs text-faint">{profile.prompts.length.toLocaleString("fa-IR")} اثر عمومی</span></div>{profile.prompts.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{profile.prompts.map((prompt) => <PromptCard key={prompt.id} id={prompt.slug} href={`/prompts/${prompt.slug}`} title={prompt.title} description={prompt.description} images={prompt.images} author={prompt.author} category={prompt.category} tags={prompt.tags} version={prompt.version} stats={{ likes: prompt.stats.likes, saves: prompt.stats.saves, forks: prompt.stats.forks, rating: prompt.stats.ratingAverage }} />)}</div> : <Card className="p-8 text-center text-sm text-faint">هنوز پرامپت عمومی ندارد.</Card>}</section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">مهارت‌ها</h2><span className="text-xs text-faint">{profile.skills.length.toLocaleString("fa-IR")} مهارت عمومی</span></div>{profile.skills.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{profile.skills.map((skill) => <SkillCard key={skill.id} id={skill.slug} href={`/skills/${skill.slug}`} name={skill.title} description={skill.description} images={skill.images} creator={skill.author} modules={skill.tags} forks={skill.stats.forks} rating={skill.stats.ratingAverage} version={skill.version} />)}</div> : <Card className="p-8 text-center text-sm text-faint">هنوز مهارت عمومی ندارد.</Card>}</section>
    </div>
  );
}
