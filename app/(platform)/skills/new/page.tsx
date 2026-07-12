import { PageHeader } from "@/components/layout/page-header";
import { CreateSkillForm } from "@/features/content/create-skill-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "ساخت مهارت" };

export default async function NewSkillPage() {
  await requireUser();
  return <div className="space-y-7"><PageHeader eyebrow="دانش قابل استفاده" title="ساخت یک مهارت" description="دانش، دستورالعمل، گردش کار و ابزارها را در یک بسته حرفه‌ای تعریف کنید." breadcrumbs={[{ label: "کاوش مهارت‌ها", href: "/explore?type=skills" }, { label: "ساخت مهارت" }]} /><CreateSkillForm /></div>;
}
