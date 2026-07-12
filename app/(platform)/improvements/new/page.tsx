import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getImprovementDraftContext } from "@/features/improvements/data";
import { OpenImprovementForm } from "@/features/improvements/open-improvement-form";
import { requireUser } from "@/lib/auth/dal";

type Search = Promise<{ type?: string; targetId?: string }>;

export const metadata = { title: "ارسال پیشنهاد بهبود" };

export default async function NewImprovementPage({ searchParams }: { searchParams: Search }) {
  const user = await requireUser();
  const query = await searchParams;
  if ((query.type !== "Prompt" && query.type !== "Skill") || !query.targetId) notFound();

  const context = await getImprovementDraftContext({
    targetType: query.type,
    targetId: query.targetId,
    user,
  });
  if (!context) notFound();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="همکاری با مالک"
        title={`پیشنهاد تغییر برای ${context.targetTitle}`}
        description={`تمام بخش‌های ${query.type === "Prompt" ? "پرامپت" : "مهارت"} را بررسی و ویرایش کنید؛ نسخه پیشنهادی برای ${context.ownerName} ارسال می‌شود.`}
        breadcrumbs={[{ label: "پیشنهادها", href: "/improvements" }, { label: "پیشنهاد تازه" }]}
      />
      <OpenImprovementForm
        targetType={query.type}
        targetId={query.targetId}
        baseVersionId={context.baseVersionId}
        initialSnapshot={context.initialSnapshot}
      />
    </div>
  );
}
