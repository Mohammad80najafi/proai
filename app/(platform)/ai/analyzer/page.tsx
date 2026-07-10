import { PageHeader } from "@/components/layout/page-header";
import { AnalyzerForm } from "@/features/ai/analyzer-form";

export const metadata = { title: "تحلیل‌گر پرامپت" };

export default function AnalyzerPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="دستیار هوشمند"
        title="تحلیل‌گر و بهبوددهنده پرامپت"
        description="کیفیت پرامپت را در شش بُعد اندازه بگیرید، ایرادهای اثرگذار را پیدا کنید و نسخه‌ای ساختاریافته‌تر بسازید."
        breadcrumbs={[{ label: "خانه", href: "/" }, { label: "تحلیل‌گر" }]}
      />
      <AnalyzerForm />
    </div>
  );
}
