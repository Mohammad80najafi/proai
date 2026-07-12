"use client";

import { useActionState } from "react";
import { GitCompareArrows, GitPullRequestArrow, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/form-controls";
import { openImprovementRequestAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { ProposalFields } from "@/features/improvements/proposal-fields";

const initialState: ContentActionState = { status: "idle" };

export function OpenImprovementForm({ targetType, targetId, baseVersionId, initialSnapshot }: { targetType: "Prompt" | "Skill"; targetId: string; baseVersionId: string; initialSnapshot: Record<string, unknown> }) {
  const [state, action, pending] = useActionState(openImprovementRequestAction, initialState);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-start">
      <Card className="space-y-7 p-5 sm:p-7">
        <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><input type="hidden" name="baseVersionId" value={baseVersionId} />
        <div className="flex items-start gap-3 border-b border-white/[0.07] pb-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><GitCompareArrows className="size-5" /></span>
          <div><h2 className="font-semibold">نسخه پیشنهادی کامل</h2><p className="mt-1 text-xs leading-6 text-muted">هر فیلدی را که لازم است تغییر دهید. مالک تفاوت دقیق هر بخش را خواهد دید.</p></div>
        </div>
        <ProposalFields targetType={targetType} snapshot={initialSnapshot} errors={state.errors} />
      </Card>
      <aside className="space-y-4 xl:sticky xl:top-24">
        <Card className="space-y-5 p-5">
          <Input name="requestTitle" label="عنوان پیشنهاد" placeholder="مثلاً: بهبود ساختار خروجی و مثال‌ها" error={state.errors?.requestTitle?.[0]} required />
          <Textarea name="summary" label="خلاصه تغییرات" placeholder="چه چیزی تغییر کرده و مالک هنگام بررسی به چه نکته‌ای توجه کند؟" rows={8} error={state.errors?.summary?.[0]} required />
        </Card>
        <Card className="border-primary/15 bg-primary-soft p-5 text-xs leading-7 text-muted"><div className="mb-2 flex items-center gap-2 font-semibold text-primary-strong"><GitPullRequestArrow className="size-4" />بعد از ارسال</div>هیچ پرامپت یا مهارت تازه‌ای ساخته نمی‌شود. مالک تفاوت‌ها را بررسی می‌کند و با پذیرش پیشنهاد، همین محتوای اصلی به نسخه بعدی ارتقا پیدا می‌کند.</Card>
        {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{state.message}</p> : null}
        <Button type="submit" size="lg" fullWidth disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <GitPullRequestArrow className="size-4" />}{pending ? "در حال ارسال…" : "ارسال پیشنهاد برای مالک"}</Button>
      </aside>
    </form>
  );
}
