import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { OpenImprovementForm } from "@/features/improvements/open-improvement-form";
import { requireUser } from "@/lib/auth/dal";

type Search = Promise<{ type?: string; targetId?: string; forkId?: string; baseVersionId?: string }>;

export const metadata = { title: "ارسال پیشنهاد بهبود" };

export default async function NewImprovementPage({ searchParams }: { searchParams: Search }) {
  await requireUser();
  const query = await searchParams;
  if ((query.type !== "Prompt" && query.type !== "Skill") || !query.targetId || !query.forkId || !query.baseVersionId) notFound();
  return <div className="space-y-7"><PageHeader eyebrow="همکاری با مالک" title="ارسال پیشنهاد بهبود" description="تغییرات فورک شما به‌شکل یک درخواست قابل گفت‌وگو برای مالک محتوا ارسال می‌شود." breadcrumbs={[{ label: "پیشنهادها", href: "/improvements" }, { label: "پیشنهاد تازه" }]} /><OpenImprovementForm targetType={query.type} targetId={query.targetId} forkId={query.forkId} baseVersionId={query.baseVersionId} /></div>;
}
