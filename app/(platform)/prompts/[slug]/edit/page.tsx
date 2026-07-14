import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { History, PencilLine } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { UpdatePromptForm } from "@/features/content/update-prompt-form";
import { getPromptEditData } from "@/features/content/data";
import { requireUser } from "@/lib/auth/dal";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "به‌روزرسانی پرامپت" };

export default async function EditPromptPage({ params }: Props) {
  const [user, { slug }] = await Promise.all([requireUser(), params]);
  const prompt = await getPromptEditData(slug, user.id).catch(() => null);
  if (!prompt) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "اکسپلور", href: "/explore?type=prompts" },
          { label: prompt.title, href: `/prompts/${prompt.slug}` },
          { label: "به‌روزرسانی" },
        ]}
        eyebrow={<span className="inline-flex items-center gap-2"><PencilLine className="size-4" aria-hidden />ویرایش توسط مالک</span>}
        title="نسخه بهتری از پرامپت منتشر کنید."
        description="اطلاعات فعلی را اصلاح کنید و دلیل تغییر را بنویسید. نسخه قبلی در تاریخچه باقی می‌ماند و نشانی پرامپت تغییر نمی‌کند."
        meta={<><Badge variant="indigo"><History className="size-3" aria-hidden />نسخه فعلی {prompt.versionLabel}</Badge><span className="text-xs text-faint">فقط شما به‌عنوان مالک می‌توانید نسخه رسمی منتشر کنید.</span></>}
      />
      <UpdatePromptForm prompt={prompt} />
    </div>
  );
}
