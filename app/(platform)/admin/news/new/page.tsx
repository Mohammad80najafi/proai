import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { NewsEditorForm } from "@/features/admin/news-editor-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "خبر تازه" };

export default async function NewAdminNewsPage() {
  const user = await requireUser();
  if (!user.roles.includes("admin")) redirect("/");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin?view=news" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowRight className="size-4" />بازگشت به میز خبر</Link>
      <header><p className="text-[10px] font-semibold tracking-[0.15em] text-orange-200">NEWS DESK / CREATE</p><h1 className="mt-2 text-3xl font-black">ساخت خبر تازه</h1><p className="mt-3 text-sm text-slate-500">خبر را به‌صورت پیش‌نویس آماده کنید یا مستقیم در صفحه اصلی منتشر کنید.</p></header>
      <NewsEditorForm />
    </div>
  );
}
