"use client";

import { useActionState } from "react";
import { GitPullRequestArrow, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/form-controls";
import { openImprovementRequestAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

export function OpenImprovementForm({ targetType, targetId, forkId, baseVersionId }: { targetType: "Prompt" | "Skill"; targetId: string; forkId: string; baseVersionId: string }) {
  const [state, action, pending] = useActionState(openImprovementRequestAction, initialState);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="space-y-6 p-5 sm:p-7">
        <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><input type="hidden" name="forkId" value={forkId} /><input type="hidden" name="baseVersionId" value={baseVersionId} />
        <Input name="title" label="عنوان پیشنهاد" placeholder="مثلاً: افزودن محدودیت‌ها و قالب خروجی دقیق" error={state.errors?.title?.[0]} required />
        <Textarea name="summary" label="خلاصه تغییرات" placeholder="چه چیزی تغییر کرده، چرا بهتر است و مالک هنگام بررسی باید به چه نکته‌ای توجه کند؟" rows={9} error={state.errors?.summary?.[0]} required />
      </Card>
      <div className="space-y-4">
        <Card className="p-5 text-sm leading-8 text-muted"><div className="mb-3 flex items-center gap-2 font-semibold text-primary-strong"><GitPullRequestArrow className="size-4" />بعد از ارسال</div><ul className="space-y-2 text-xs"><li>مالک تغییرات فورک را با نسخه پایه مقایسه می‌کند.</li><li>برای این پیشنهاد یک گفت‌وگوی اختصاصی ساخته می‌شود.</li><li>پذیرش، نسخه رسمی تازه با نام شما می‌سازد.</li><li>در صورت تغییر نسخه اصلی، تداخل به‌طور خودکار اعلام می‌شود.</li></ul></Card>
        {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{state.message}</p> : null}
        <Button type="submit" size="lg" fullWidth disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <GitPullRequestArrow className="size-4" />}{pending ? "در حال ارسال…" : "ارسال پیشنهاد برای مالک"}</Button>
      </div>
    </form>
  );
}
