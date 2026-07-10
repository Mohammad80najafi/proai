import { Braces, Shapes } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PromptCard } from "@/components/ui/prompt-card";
import { SearchBox } from "@/components/ui/search-box";
import { Select } from "@/components/ui/form-controls";
import { SkillCard } from "@/components/ui/skill-card";
import { Tabs } from "@/components/ui/tabs";
import { getExploreContent } from "@/features/content/data";

type ExploreSearchParams = Promise<{
  q?: string;
  type?: string;
  category?: string;
  sort?: string;
}>;

export const metadata = { title: "کاوش" };

export default async function ExplorePage({ searchParams }: { searchParams: ExploreSearchParams }) {
  const params = await searchParams;
  const activeType = ["all", "prompts", "skills"].includes(params.type ?? "") ? (params.type ?? "all") : "all";
  let content = { prompts: [], skills: [] } as Awaited<ReturnType<typeof getExploreContent>>;
  let connected = true;
  try {
    content = await getExploreContent({
      query: params.q,
      category: params.category,
      sort: params.sort === "popular" || params.sort === "rating" ? params.sort : "newest",
      limit: 24,
    });
  } catch {
    connected = false;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="کتابخانه جامعه"
        title="کشف ایده‌های قابل استفاده"
        description="میان پرامپت‌ها و مهارت‌های نسخه‌پذیر جست‌وجو کنید و نقطه شروع پروژه بعدی را پیدا کنید."
      />

      <Card className="p-4 sm:p-5">
        <SearchBox defaultValue={params.q} className="mb-4" shortcut="↵" />
        <form action="/explore" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
          <Select name="category" defaultValue={params.category ?? "all"} label="دسته‌بندی">
            <option value="all">همه دسته‌ها</option>
            <option value="development">برنامه‌نویسی</option>
            <option value="writing">تولید محتوا</option>
            <option value="design">طراحی</option>
            <option value="business">کسب‌وکار</option>
            <option value="education">آموزش</option>
            <option value="research">تحقیق</option>
            <option value="productivity">بهره‌وری</option>
          </Select>
          <Select name="sort" defaultValue={params.sort ?? "newest"} label="مرتب‌سازی">
            <option value="newest">تازه‌ترین</option>
            <option value="popular">محبوب‌ترین</option>
            <option value="rating">بالاترین امتیاز</option>
          </Select>
          <button type="submit" className="mt-auto h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong">
            اعمال فیلتر
          </button>
        </form>
      </Card>

      <Tabs
        activeKey={activeType}
        items={[
          { key: "all", label: "همه", href: "/explore", count: content.prompts.length + content.skills.length },
          { key: "prompts", label: "پرامپت‌ها", href: "/explore?type=prompts", icon: <Braces />, count: content.prompts.length },
          { key: "skills", label: "مهارت‌ها", href: "/explore?type=skills", icon: <Shapes />, count: content.skills.length },
        ]}
      />

      {!connected ? (
        <Card className="p-8 text-center text-sm leading-7 text-muted">اتصال به MongoDB برقرار نیست. پس از اجرای پایگاه داده، محتوای جامعه اینجا نمایش داده می‌شود.</Card>
      ) : null}

      {(activeType === "all" || activeType === "prompts") && content.prompts.length ? (
        <section aria-labelledby="explore-prompts">
          <h2 id="explore-prompts" className="mb-4 text-lg font-bold">پرامپت‌ها</h2>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {content.prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                id={prompt.slug}
                href={`/prompts/${prompt.slug}`}
                title={prompt.title}
                description={prompt.description}
                author={prompt.author}
                category={prompt.category}
                tags={prompt.tags}
                version={prompt.version}
                stats={{ likes: prompt.stats.likes, saves: prompt.stats.saves, forks: prompt.stats.forks, rating: prompt.stats.ratingAverage }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(activeType === "all" || activeType === "skills") && content.skills.length ? (
        <section aria-labelledby="explore-skills">
          <h2 id="explore-skills" className="mb-4 text-lg font-bold">مهارت‌ها</h2>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {content.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                id={skill.slug}
                href={`/skills/${skill.slug}`}
                name={skill.title}
                description={skill.description}
                creator={skill.author}
                modules={skill.tags}
                forks={skill.stats.forks}
                rating={skill.stats.ratingAverage}
                version={skill.version}
              />
            ))}
          </div>
        </section>
      ) : null}

      {connected && content.prompts.length === 0 && content.skills.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="font-semibold">نتیجه‌ای پیدا نشد</h2>
          <p className="mt-2 text-sm text-muted">عبارت جست‌وجو یا فیلترها را تغییر دهید.</p>
        </Card>
      ) : null}
    </div>
  );
}
