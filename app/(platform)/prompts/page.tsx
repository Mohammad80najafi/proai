import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PromptCard } from "@/components/ui/prompt-card";
import { getExploreContent } from "@/features/content/data";

export const metadata = { title: "پرامپت‌ها" };

export default async function PromptsPage() {
  let prompts: Awaited<ReturnType<typeof getExploreContent>>["prompts"] = [];
  try { prompts = (await getExploreContent({ sort: "newest", limit: 36 })).prompts; } catch {}
  return <div className="space-y-7"><PageHeader eyebrow="کتابخانه پرامپت" title="پرامپت‌های جامعه" description="آثار نسخه‌پذیر، قابل فورک و آماده استفاده را پیدا کنید." actions={<ButtonLink href="/prompts/new"><Plus className="size-4" />ساخت پرامپت</ButtonLink>} />{prompts.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{prompts.map((prompt) => <PromptCard key={prompt.id} id={prompt.slug} href={`/prompts/${prompt.slug}`} title={prompt.title} description={prompt.description} author={prompt.author} category={prompt.category} tags={prompt.tags} version={prompt.version} stats={{ likes: prompt.stats.likes, saves: prompt.stats.saves, forks: prompt.stats.forks, rating: prompt.stats.ratingAverage }} />)}</div> : <Card className="p-10 text-center text-sm text-muted">هنوز پرامپتی منتشر نشده است یا MongoDB در دسترس نیست.</Card>}</div>;
}
