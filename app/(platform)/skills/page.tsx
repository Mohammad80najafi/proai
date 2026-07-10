import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkillCard } from "@/components/ui/skill-card";
import { getExploreContent } from "@/features/content/data";

export const metadata = { title: "مهارت‌ها" };

export default async function SkillsPage() {
  let skills: Awaited<ReturnType<typeof getExploreContent>>["skills"] = [];
  try { skills = (await getExploreContent({ sort: "newest", limit: 36 })).skills; } catch {}
  return <div className="space-y-7"><PageHeader eyebrow="کتابخانه مهارت" title="مهارت‌های تخصصی" description="بسته‌های ساختاریافته دانش، دستورالعمل، ابزار و گردش کار را کشف کنید." actions={<ButtonLink href="/skills/new"><Plus className="size-4" />ساخت مهارت</ButtonLink>} />{skills.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{skills.map((skill) => <SkillCard key={skill.id} id={skill.slug} href={`/skills/${skill.slug}`} name={skill.title} description={skill.description} creator={skill.author} modules={skill.tags} forks={skill.stats.forks} rating={skill.stats.ratingAverage} version={skill.version} />)}</div> : <Card className="p-10 text-center text-sm text-muted">هنوز مهارتی منتشر نشده است یا MongoDB در دسترس نیست.</Card>}</div>;
}
