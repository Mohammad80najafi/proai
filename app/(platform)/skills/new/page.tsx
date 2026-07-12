import Link from "next/link";
import { ArrowRight, Boxes, ImagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CreateSkillForm } from "@/features/content/create-skill-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata = { title: "ساخت مهارت" };

export default async function NewSkillPage() {
  await requireUser();
  return (
    <div className="space-y-8">
      <Link href="/explore?type=skills" className="inline-flex items-center gap-2 text-xs text-faint transition-colors hover:text-white"><ArrowRight className="size-4" />بازگشت به مهارت‌ها</Link>
      <header className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-[radial-gradient(circle_at_88%_10%,rgba(168,85,247,0.17),transparent_34%),#0c0a13] px-6 py-9 sm:px-10 sm:py-12">
        <Boxes className="absolute -left-6 -top-8 size-44 text-white/[0.022]" aria-hidden />
        <div className="relative max-w-3xl">
          <div className="mb-5 flex flex-wrap gap-2"><Badge variant="indigo">Skill Workshop</Badge><Badge><ImagePlus className="size-3" /> تا ۸ تصویر</Badge></div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">دانش را به یک مهارت اجرایی تبدیل کنید.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">دستورالعمل، ابزار، گردش کار و تصاویر مرجع را در یک بسته نسخه‌پذیر و آماده همکاری جمع کنید.</p>
        </div>
      </header>
      <CreateSkillForm />
    </div>
  );
}
