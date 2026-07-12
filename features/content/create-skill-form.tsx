"use client";

import { useActionState } from "react";
import { CheckCircle2, Eye, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { createSkillAction } from "@/features/content/actions";
import { ContentImageUploader } from "@/features/content/content-image-uploader";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

function SectionLabel({ number, title, helper }: { number: string; title: string; helper: string }) {
  return <div className="mb-6 flex items-start gap-3"><span className="font-mono text-[11px] font-bold text-[#cbb7ff]">{number}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-[11px] leading-6 text-faint">{helper}</p></div></div>;
}

export function CreateSkillForm() {
  const [state, action, pending] = useActionState(createSkillAction, initialState);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className="space-y-5">
        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="01" title="هویت مهارت" helper="دامنه توانایی و نتیجه‌ای را که این بسته دانشی ایجاد می‌کند روشن کنید." />
          <div className="space-y-5"><Input name="name" label="نام مهارت" placeholder="مثلاً: توسعه‌دهنده ارشد فول‌استک" error={state.errors?.name?.[0]} required /><Textarea name="description" label="خلاصه توانایی" placeholder="این مهارت چه توانایی‌هایی را به کاربر می‌دهد؟" rows={4} error={state.errors?.description?.[0]} required /></div>
        </section>

        <ContentImageUploader />

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="02" title="دستورالعمل و دانش" helper="رفتار، اصول تصمیم‌گیری و پیش‌نیازهای مهارت را تعریف کنید." />
          <div className="space-y-5">
            <Textarea name="instructions" label="دستورالعمل اصلی" placeholder="نقش، اصول تصمیم‌گیری، استانداردها و رفتار مورد انتظار را دقیق بنویسید…" rows={15} className="min-h-[360px] technical-content text-[13px]" error={state.errors?.instructions?.[0]} required />
            <div className="grid gap-5 md:grid-cols-2"><Textarea name="requiredKnowledge" label="دانش مورد نیاز" placeholder={'React\nMongoDB\nامنیت وب'} hint="هر مورد در یک خط" rows={6} /><Textarea name="tools" label="ابزارها" placeholder={'Git\nDocker\nPlaywright'} hint="هر ابزار در یک خط" rows={6} /></div>
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="03" title="گردش کار و اتصال‌ها" helper="مسیر اجرای مهارت و بسته‌هایی را که به آن‌ها تکیه دارد مشخص کنید." />
          <div className="space-y-5"><Textarea name="workflow" label="گردش کار" placeholder={'نیازمندی‌ها را تحلیل کن\nمعماری را طراحی کن\nپیاده‌سازی و تست کن'} hint="هر گام در یک خط." rows={7} error={state.errors?.workflow?.[0]} /><Textarea name="dependencies" label="وابستگی‌ها" placeholder={'React Expert@^2\nSecurity Expert@1'} hint="نام و نسخه را با @ جدا کنید." rows={5} /><Input name="tags" label="برچسب‌ها" placeholder="فول‌استک، React، پایگاه‌داده" hint="با ویرگول جدا کنید." /></div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <div className="rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.07]"><div className="space-y-5 rounded-[calc(1.75rem-0.375rem)] bg-[#0d131e] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]"><div><p className="text-[10px] font-semibold tracking-[0.15em] text-[#cbb7ff]">PUBLISH</p><h2 className="mt-2 text-lg font-black">انتشار مهارت</h2></div><Select name="visibility" label="دسترسی" defaultValue="public"><option value="public">عمومی</option><option value="unlisted">فقط با پیوند</option><option value="draft">پیش‌نویس</option></Select><Select name="license" label="مجوز استفاده" defaultValue="cc-by-4.0"><option value="cc-by-4.0">CC BY 4.0</option><option value="cc-by-sa-4.0">CC BY-SA 4.0</option><option value="mit">MIT</option><option value="proprietary">همه حقوق محفوظ</option><option value="unspecified">مشخص‌نشده</option></Select><div className="rounded-2xl bg-violet-400/[0.08] p-4 text-[11px] leading-6 text-muted"><div className="mb-2 flex items-center gap-2 font-semibold text-violet-300"><CheckCircle2 className="size-4" strokeWidth={1.5} />بسته دانشی ساختاریافته</div>دانش، ابزار و گردش کار در یک نسخه رسمی قابل بهبود ذخیره می‌شوند.</div>{state.status === "error" ? <p role="alert" className="rounded-xl bg-danger/10 p-3 text-xs leading-6 text-danger">{state.message}</p> : null}<Button type="submit" size="lg" fullWidth disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{pending ? "در حال ساخت…" : "ساخت مهارت"}</Button></div></div>
        <div className="flex items-start gap-3 rounded-2xl bg-white/[0.025] p-4 text-[11px] leading-6 text-faint ring-1 ring-white/[0.05]"><Eye className="mt-0.5 size-4 shrink-0" strokeWidth={1.4} />برای نمایش نمونه خروجی، نمودار گردش کار یا اسکرین‌شات ابزارها چند تصویر اضافه کنید.</div>
      </aside>
    </form>
  );
}
