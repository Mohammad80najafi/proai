"use client";

import { useActionState } from "react";
import { CheckCircle2, Eye, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { createPromptAction } from "@/features/content/actions";
import { ContentImageUploader } from "@/features/content/content-image-uploader";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

function SectionLabel({ number, title, helper }: { number: string; title: string; helper: string }) {
  return <div className="mb-6 flex items-start gap-3"><span className="font-mono text-[11px] font-bold text-primary-strong">{number}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-[11px] leading-6 text-faint">{helper}</p></div></div>;
}

export function CreatePromptForm() {
  const [state, action, pending] = useActionState(createPromptAction, initialState);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className="space-y-5">
        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="01" title="هویت پرامپت" helper="به خواننده بگویید این اثر برای چه مسئله‌ای ساخته شده است." />
          <div className="space-y-5">
            <Input name="title" label="عنوان پرامپت" placeholder="مثلاً: معمار ارشد سامانه‌های هوش مصنوعی" error={state.errors?.title?.[0]} required />
            <Textarea name="description" label="خلاصه کاربرد" placeholder="این پرامپت چه مسئله‌ای را حل می‌کند و برای چه کسی مناسب است؟" rows={4} error={state.errors?.description?.[0]} required />
          </div>
        </section>

        <ContentImageUploader />

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="02" title="متن قابل استفاده" helper="نقش، زمینه، محدودیت و قالب خروجی را طوری بنویسید که قابل اجرا و بهبود باشد." />
          <Textarea name="content" label="متن پرامپت" placeholder="نقش، هدف، زمینه، محدودیت‌ها و قالب خروجی را بنویسید…" rows={20} error={state.errors?.content?.[0]} className="min-h-[480px] technical-content text-[13px]" required />
        </section>

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="03" title="کشف‌پذیری" helper="برچسب‌های دقیق کمک می‌کنند افراد مناسب اثر شما را پیدا کنند." />
          <Input name="tags" label="برچسب‌ها" placeholder="معماری، امنیت، مقیاس‌پذیری" hint="با ویرگول جدا کنید؛ حداکثر ۱۲ مورد." error={state.errors?.tags?.[0]} />
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <div className="rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.07]">
          <div className="space-y-5 rounded-[calc(1.75rem-0.375rem)] bg-[#0d131e] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            <div><p className="text-[10px] font-semibold tracking-[0.15em] text-primary-strong">PUBLISH</p><h2 className="mt-2 text-lg font-black">انتشار پرامپت</h2></div>
            <Select name="category" label="دسته‌بندی" defaultValue="development" error={state.errors?.category?.[0]}>
              <option value="development">برنامه‌نویسی</option><option value="writing">تولید محتوا</option><option value="design">طراحی</option><option value="business">کسب‌وکار</option><option value="education">آموزش</option><option value="research">تحقیق</option><option value="productivity">بهره‌وری</option><option value="other">سایر</option>
            </Select>
            <Select name="visibility" label="دسترسی" defaultValue="public">
              <option value="public">عمومی</option><option value="unlisted">فقط با پیوند</option><option value="draft">پیش‌نویس</option>
            </Select>
            <div className="rounded-2xl bg-primary-soft p-4 text-[11px] leading-6 text-muted"><div className="mb-2 flex items-center gap-2 font-semibold text-primary-strong"><CheckCircle2 className="size-4" strokeWidth={1.5} />نسخه‌پذیر از ابتدا</div>انتشار، نسخه رسمی ۱ را می‌سازد و تاریخچه تغییرات را حفظ می‌کند.</div>
            {state.status === "error" ? <p role="alert" className="rounded-xl bg-danger/10 p-3 text-xs leading-6 text-danger">{state.message}</p> : null}
            <Button type="submit" size="lg" fullWidth disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{pending ? "در حال ساخت…" : "ساخت پرامپت"}
            </Button>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-white/[0.025] p-4 text-[11px] leading-6 text-faint ring-1 ring-white/[0.05]"><Eye className="mt-0.5 size-4 shrink-0" strokeWidth={1.4} />تصویر اول روی کارت و بالای صفحه جزئیات دیده می‌شود؛ تصاویر بعدی در گالری قرار می‌گیرند.</div>
      </aside>
    </form>
  );
}
