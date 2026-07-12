import Link from "next/link";
import { ArrowRight, Braces, ImagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CreatePromptForm } from "@/features/content/create-prompt-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "ساخت پرامپت" };

export default async function NewPromptPage() {
  await requireUser();
  return (
    <div className="space-y-8">
      <Link href="/explore?type=prompts" className="inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-white"><ArrowRight className="size-4" />بازگشت به پرامپت‌ها</Link>
      <header className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-[radial-gradient(circle_at_12%_10%,rgba(99,102,241,0.17),transparent_32%),#090d16] px-6 py-9 sm:px-10 sm:py-12">
        <Braces className="absolute -left-6 -top-8 size-44 text-white/[0.022]" aria-hidden />
        <div className="relative max-w-3xl">
          <div className="mb-5 flex flex-wrap gap-2"><Badge variant="indigo">Prompt Studio</Badge><Badge><ImagePlus className="size-3" /> تا ۸ تصویر</Badge></div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">یک پرامپت قابل استفاده بسازید.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">ایده، متن و تصاویر نمونه را کنار هم منتشر کنید؛ اثری که خواندن، ذخیره‌کردن و توسعه‌دادنش برای جامعه ساده باشد.</p>
        </div>
      </header>
      <CreatePromptForm />
    </div>
  );
}
