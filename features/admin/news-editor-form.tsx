"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine, LoaderCircle, Newspaper, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import {
  createNewsAction,
  deleteNewsAction,
  updateNewsAction,
  type AdminActionState,
} from "@/features/admin/actions";
import type { NewsStory } from "@/features/news/data";

const initialState: AdminActionState = { status: "idle" };

export function NewsEditorForm({ story }: { story?: NewsStory }) {
  const router = useRouter();
  const editing = Boolean(story);
  const [state, action, pending] = useActionState(editing ? updateNewsAction : createNewsAction, initialState);
  const firstSection = story?.sections[0];
  const secondSection = story?.sections[1];
  const readTime = story?.readTime ? Number(story.readTime.replace(/[^\d۰-۹]/g, "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))) || 5 : 5;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.push("/admin?view=news");
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [router, state.message, state.status]);

  return (
    <form action={action} className="space-y-6">
      {editing ? <input type="hidden" name="originalSlug" value={story?.slug} /> : null}
      <section className="rounded-2xl border border-white/[0.07] bg-[#0d121e] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-400/10 text-orange-200"><Newspaper className="size-4" /></span><div><h2 className="font-semibold">هویت خبر</h2><p className="mt-1 text-[10px] text-slate-600">عنوان، منبع و جایگاه انتشار</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="title" defaultValue={story?.title} label="عنوان خبر" error={state.errors?.title?.[0]} required containerClassName="sm:col-span-2" />
          <Input name="slug" defaultValue={story?.slug} label="شناسه URL" hint={editing ? "شناسه خبر هنگام ویرایش ثابت می‌ماند." : "خالی بگذارید تا از عنوان ساخته شود."} readOnly={editing} error={state.errors?.slug?.[0]} dir="ltr" />
          <Input name="category" defaultValue={story?.category} label="دسته‌بندی" error={state.errors?.category?.[0]} required />
          <Input name="source" defaultValue={story?.source} label="نام منبع" error={state.errors?.source?.[0]} required />
          <Input name="sourceUrl" type="url" defaultValue={story?.sourceUrl} label="پیوند منبع" error={state.errors?.sourceUrl?.[0]} required dir="ltr" />
          <Input name="coverImage" defaultValue={story?.coverImage ?? "/images/news/ai-agent-newsroom-cover.png"} label="مسیر تصویر جلد" hint="مثال: /images/news/cover.png" error={state.errors?.coverImage?.[0]} required dir="ltr" />
          <Input name="readTimeMinutes" type="number" min={1} max={120} defaultValue={readTime} label="زمان مطالعه (دقیقه)" error={state.errors?.readTimeMinutes?.[0]} required />
          <Select name="accentTheme" defaultValue={story?.accentTheme ?? "mint"} label="رنگ پرونده">
            <option value="mint">نعنایی</option><option value="sky">آبی</option><option value="amber">کهربایی</option><option value="violet">بنفش</option>
          </Select>
          <Select name="status" defaultValue={story?.status ?? "draft"} label="وضعیت انتشار">
            <option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option>
          </Select>
          <Input name="publishedAt" type="date" defaultValue={story?.publishedAt?.slice(0, 10)} label="تاریخ انتشار" />
          <label className="flex h-11 items-center gap-3 self-end rounded-xl border border-white/[0.09] bg-[#090e18] px-3.5 text-sm text-slate-300">
            <input name="featured" type="checkbox" defaultChecked={Boolean(story?.featured)} className="size-4 accent-orange-400" />
            داستان اصلی صفحه باشد
          </label>
        </div>
        <Textarea name="summary" defaultValue={story?.summary} label="خلاصه خبر" rows={4} error={state.errors?.summary?.[0]} required containerClassName="mt-4" />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d121e] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-indigo-400/10 text-indigo-200"><FilePenLine className="size-4" /></span><div><h2 className="font-semibold">بدنه تحریریه</h2><p className="mt-1 text-[10px] text-slate-600">هر پاراگراف را با یک خط خالی از بعدی جدا کنید.</p></div></div>
        <div className="space-y-4">
          <Input name="sectionHeading1" defaultValue={firstSection?.heading} label="تیتر بخش اول" error={state.errors?.sectionHeading1?.[0]} required />
          <Textarea name="sectionParagraphs1" defaultValue={firstSection?.paragraphs.join("\n\n")} label="متن بخش اول" rows={8} error={state.errors?.sectionParagraphs1?.[0]} required />
          <div className="border-t border-white/[0.06] pt-4"><Input name="sectionHeading2" defaultValue={secondSection?.heading} label="تیتر بخش دوم (اختیاری)" error={state.errors?.sectionHeading2?.[0]} /></div>
          <Textarea name="sectionParagraphs2" defaultValue={secondSection?.paragraphs.join("\n\n")} label="متن بخش دوم" rows={7} error={state.errors?.sectionParagraphs2?.[0]} />
          <Textarea name="takeaways" defaultValue={story?.takeaways.join("\n")} label="نکته‌های کلیدی" hint="هر نکته را در یک خط بنویسید." rows={5} error={state.errors?.takeaways?.[0]} />
        </div>
      </section>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-[#0b1019]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,.35)] backdrop-blur-xl lg:bottom-4">
        <p className={`text-xs ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`} aria-live="polite">{state.message}</p>
        <Button type="submit" loading={pending} loadingLabel="در حال ذخیره…">
          <Save className="size-4" aria-hidden />{editing ? "ذخیره تغییرات" : "ساخت خبر"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteNewsButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteNewsAction, initialState);
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      router.refresh();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [router, state.message, state.status]);
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`خبر «${title}» حذف شود؟`)) event.preventDefault(); }}>
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        حذف
      </Button>
    </form>
  );
}
