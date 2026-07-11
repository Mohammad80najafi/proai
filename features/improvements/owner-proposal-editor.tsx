"use client";

import { useActionState } from "react";
import { LoaderCircle, PencilLine, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form-controls";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { updateImprovementProposalAction } from "@/features/improvements/actions";
import { ProposalFields } from "@/features/improvements/proposal-fields";

const initialState: ContentActionState = { status: "idle" };

export function OwnerProposalEditor({ requestId, targetType, snapshot, summary }: { requestId: string; targetType: "Prompt" | "Skill"; snapshot: Record<string, unknown>; summary: string }) {
  const [state, action, pending] = useActionState(updateImprovementProposalAction, initialState);
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-semibold outline-none transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-primary/70">
        <span className="flex items-center gap-2"><PencilLine className="size-4 text-primary-strong" />اصلاح پیشنهاد توسط مالک</span>
        <span className="text-xs font-normal text-faint group-open:hidden">باز کردن ویرایشگر</span>
      </summary>
      <form action={action} className="mt-4 space-y-6">
        <input type="hidden" name="requestId" value={requestId} />
        <Card className="space-y-6 p-5 sm:p-6">
          <ProposalFields targetType={targetType} snapshot={snapshot} errors={state.errors} />
          <Textarea name="summary" label="خلاصه نهایی تغییرات" defaultValue={summary} rows={5} required />
        </Card>
        {state.message ? <p role={state.status === "error" ? "alert" : undefined} className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "در حال ذخیره…" : "ذخیره نسخه اصلاح‌شده"}</Button>
      </form>
    </details>
  );
}
