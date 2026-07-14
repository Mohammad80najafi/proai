import { Bookmark, Braces, Compass, Shapes } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getSavedContent } from "@/features/content/data";
import { SavedContentCard } from "@/features/saved/saved-content-card";
import { requireUser } from "@/lib/auth/dal";

type SavedSearchParams = Promise<{ type?: string }>;

export const metadata = { title: "ذخیره‌ها" };

export default async function SavedPage({
  searchParams,
}: {
  searchParams: SavedSearchParams;
}) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const activeType = ["all", "prompts", "skills"].includes(params.type ?? "")
    ? (params.type ?? "all")
    : "all";
  let content = { prompts: [], skills: [] } as Awaited<ReturnType<typeof getSavedContent>>;
  let connected = true;
  try {
    content = await getSavedContent(user.id);
  } catch {
    connected = false;
  }
  const visibleItems = [
    ...(activeType === "all" || activeType === "prompts" ? content.prompts : []),
    ...(activeType === "all" || activeType === "skills" ? content.skills : []),
  ].sort((left, right) => {
    if (left.hasUnreadUpdate !== right.hasUnreadUpdate) return left.hasUnreadUpdate ? -1 : 1;
    return new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime();
  });
  const unreadCount = [...content.prompts, ...content.skills].filter((item) => item.hasUnreadUpdate).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2"><Bookmark className="size-4" />کتابخانه شخصی</span>}
        title="ذخیره‌های شما"
        description="پرامپت‌ها و مهارت‌هایی که برای استفاده دوباره نگه داشته‌اید؛ نسخه‌های تازه همیشه اول نمایش داده می‌شوند."
        meta={unreadCount ? <span className="text-xs text-cyan-300">{unreadCount.toLocaleString("fa-IR")} نسخه تازه برای دیدن دارید</span> : undefined}
        actions={<ButtonLink href="/explore" variant="outline" size="sm"><Compass className="size-4" />رفتن به کاوش</ButtonLink>}
      />

      <Tabs
        activeKey={activeType}
        items={[
          { key: "all", label: "همه", href: "/saved", count: content.prompts.length + content.skills.length },
          { key: "prompts", label: "پرامپت‌ها", href: "/saved?type=prompts", icon: <Braces />, count: content.prompts.length },
          { key: "skills", label: "مهارت‌ها", href: "/saved?type=skills", icon: <Shapes />, count: content.skills.length },
        ]}
      />

      {!connected ? (
        <Card className="p-8 text-center text-sm text-muted">ذخیره‌ها اکنون در دسترس نیستند. اتصال پایگاه داده را بررسی کنید.</Card>
      ) : visibleItems.length ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {visibleItems.map((item) => <SavedContentCard key={`${item.kind}:${item.id}`} item={item} />)}
        </div>
      ) : (
        <Card className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <Bookmark className="mx-auto size-9 text-faint" />
            <h2 className="mt-4 font-semibold">هنوز چیزی ذخیره نکرده‌اید</h2>
            <p className="mt-2 text-sm leading-7 text-muted">از صفحه هر پرامپت یا مهارت، گزینه ذخیره را بزنید تا اینجا به آن دسترسی داشته باشید.</p>
            <ButtonLink href="/explore" className="mt-5" size="sm">پیداکردن محتوا</ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
