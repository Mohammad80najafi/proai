import { PageHeader } from "@/components/layout/page-header";
import { CreatePromptForm } from "@/features/content/create-prompt-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "ساخت پرامپت" };

export default async function NewPromptPage() {
  await requireUser();
  return <div className="space-y-7"><PageHeader eyebrow="اثر تازه" title="ساخت یک پرامپت" description="پرامپتی شفاف، قابل نسخه‌بندی و آماده همکاری با جامعه بسازید." breadcrumbs={[{ label: "کاوش پرامپت‌ها", href: "/explore?type=prompts" }, { label: "ساخت پرامپت" }]} /><CreatePromptForm /></div>;
}
