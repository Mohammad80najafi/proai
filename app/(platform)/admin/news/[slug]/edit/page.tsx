import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { NewsEditorForm } from "@/features/admin/news-editor-form";
import { getNewsStory } from "@/features/news/data";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "ویرایش خبر" };

export default async function EditAdminNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  if (!user.roles.includes("admin")) redirect("/");
  const { slug } = await params;
  const story = await getNewsStory(slug, { includeDrafts: true });
  if (!story) notFound();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin?view=news" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white"><ArrowRight className="size-4" />بازگشت به میز خبر</Link>
      <header><p className="text-[10px] font-semibold tracking-[0.15em] text-orange-200">NEWS DESK / EDIT</p><h1 className="mt-2 text-3xl font-black">ویرایش خبر</h1><p className="mt-3 text-sm text-slate-500">تغییرها پس از ذخیره، در نسخه عمومی خبر و صفحه اصلی اعمال می‌شوند.</p></header>
      <NewsEditorForm story={story} />
    </div>
  );
}
