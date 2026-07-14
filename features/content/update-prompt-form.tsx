"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, History, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { createPromptVersionAction } from "@/features/content/actions";
import { ContentImageUploader } from "@/features/content/content-image-uploader";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import type { PromptEditDTO } from "@/features/shared/types";
import { nextVersionLabel, type VersionBump } from "@/features/improvements/versioning";

const initialState: ContentActionState = { status: "idle" };

function SectionLabel({ number, title, helper }: { number: string; title: string; helper: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="font-mono text-[11px] font-bold text-primary-strong">{number}</span>
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-[11px] leading-6 text-faint">{helper}</p>
      </div>
    </div>
  );
}

export function UpdatePromptForm({ prompt }: { prompt: PromptEditDTO }) {
  const [state, action, pending] = useActionState(createPromptVersionAction, initialState);
  const [versionBump, setVersionBump] = useState<VersionBump>("minor");
  const [customVersionLabel, setCustomVersionLabel] = useState("");
  const versionPreview = nextVersionLabel(prompt.versionLabel, versionBump, customVersionLabel) ?? "—";

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <input type="hidden" name="promptId" value={prompt.id} />

      <div className="space-y-5">
        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="01" title="هویت پرامپت" helper="عنوان و خلاصه را به‌روز کنید. نشانی فعلی پرامپت ثابت می‌ماند تا پیوندهای ذخیره‌شده نشکنند." />
          <div className="space-y-5">
            <Input name="title" label="عنوان پرامپت" defaultValue={prompt.title} error={state.errors?.title?.[0]} required />
            <Textarea name="description" label="خلاصه کاربرد" defaultValue={prompt.description} rows={4} error={state.errors?.description?.[0]} required />
          </div>
        </section>

        <ContentImageUploader initialImages={prompt.images} />

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="02" title="متن نسخه جدید" helper="متن فعلی از قبل قرار گرفته است؛ تغییرات لازم را اعمال کنید تا در تاریخچه نسخه‌ها ثبت شوند." />
          <Textarea name="content" label="متن پرامپت" defaultValue={prompt.content} rows={20} error={state.errors?.content?.[0]} className="min-h-[480px] technical-content text-[13px]" required />
        </section>

        <section className="rounded-[1.75rem] bg-white/[0.04] p-5 ring-1 ring-white/[0.07] sm:p-7">
          <SectionLabel number="03" title="کشف‌پذیری" helper="برچسب‌ها و دسته‌بندی نسخه جدید جایگزین اطلاعات فعلی می‌شوند." />
          <Input name="tags" label="برچسب‌ها" defaultValue={prompt.tags.join("، ")} hint="با ویرگول جدا کنید؛ حداکثر ۱۲ مورد." error={state.errors?.tags?.[0]} />
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <div className="rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/[0.07]">
          <div className="space-y-5 rounded-[calc(1.75rem-0.375rem)] bg-[#0d131e] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-primary-strong">NEW OFFICIAL VERSION</p>
              <h2 className="mt-2 text-lg font-black">انتشار به‌روزرسانی</h2>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-4">
              <History className="size-5 shrink-0 text-primary-strong" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="text-[10px] text-faint">تغییر نسخه رسمی</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-100" dir="ltr">{prompt.versionLabel} → {versionPreview}</p>
              </div>
            </div>

            <Textarea
              name="changeSummary"
              label="خلاصه تغییرات"
              placeholder="چه چیزی بهتر یا اصلاح شد؟"
              hint="این توضیح در تاریخچه نسخه‌ها به کاربران نمایش داده می‌شود."
              rows={4}
              error={state.errors?.changeSummary?.[0]}
              required
            />

            <Select name="category" label="دسته‌بندی" defaultValue={prompt.category} error={state.errors?.category?.[0]}>
              <option value="development">برنامه‌نویسی</option>
              <option value="writing">تولید محتوا</option>
              <option value="design">طراحی</option>
              <option value="business">کسب‌وکار</option>
              <option value="education">آموزش</option>
              <option value="research">تحقیق</option>
              <option value="productivity">بهره‌وری</option>
              <option value="other">سایر</option>
            </Select>
            <Select name="visibility" label="دسترسی" defaultValue={prompt.visibility} error={state.errors?.visibility?.[0]}>
              <option value="public">عمومی</option>
              <option value="unlisted">فقط با پیوند</option>
              <option value="draft">پیش‌نویس</option>
            </Select>
            <Select
              name="versionBump"
              label="نوع به‌روزرسانی"
              value={versionBump}
              onChange={(event) => setVersionBump(event.target.value as VersionBump)}
              error={state.errors?.versionBump?.[0]}
            >
              <option value="patch">Patch · اصلاح کوچک</option>
              <option value="minor">Minor · تغییر یا قابلیت سازگار</option>
              <option value="major">Major · تغییر اساسی</option>
              <option value="custom">سایر · برچسب دلخواه</option>
            </Select>
            {versionBump === "custom" ? (
              <Input
                name="customVersionLabel"
                label="برچسب نسخه دلخواه"
                value={customVersionLabel}
                onChange={(event) => setCustomVersionLabel(event.target.value)}
                placeholder="مثلاً 2.0-beta"
                hint="حروف، عدد، نقطه، خط تیره و زیرخط مجاز است."
                error={state.errors?.customVersionLabel?.[0]}
                dir="ltr"
                required
              />
            ) : <input type="hidden" name="customVersionLabel" value="" />}

            <div className="rounded-2xl bg-white/[0.03] p-4 text-[11px] leading-6 text-muted ring-1 ring-white/[0.06]">
              <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 className="size-4" strokeWidth={1.5} aria-hidden />
                تاریخچه حفظ می‌شود
              </div>
              کاربران دنبال‌کننده و افرادی که این پرامپت را ذخیره کرده‌اند، به‌روزرسانی را در اکسپلور و اعلان‌ها می‌بینند.
            </div>

            {state.status === "error" ? <p role="alert" className="rounded-xl bg-danger/10 p-3 text-xs leading-6 text-danger">{state.message}</p> : null}
            <Button type="submit" size="lg" fullWidth disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="size-4" aria-hidden />}
              {pending ? "در حال انتشار…" : "انتشار نسخه جدید"}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
