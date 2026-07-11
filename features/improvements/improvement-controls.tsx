"use client";

import { useActionState } from "react";
import { Check, LoaderCircle, MessageSquareText, RotateCcw, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { addImprovementMessageAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { decideImprovementAction } from "@/features/improvements/actions";

const initialState: ContentActionState = { status: "idle" };

export function ImprovementMessageForm({ requestId, disabled = false }: { requestId: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(addImprovementMessageAction, initialState);
  if (disabled) return <p className="rounded-xl bg-white/[0.025] p-4 text-center text-sm text-faint">این گفت‌وگو بسته شده است.</p>;
  return <form action={action} className="space-y-3"><input type="hidden" name="requestId" value={requestId} /><Textarea name="content" label="پیام" placeholder="درباره تغییرات، دلیل تصمیم یا پرسش‌های بررسی بنویسید…" rows={4} required /><div className="flex items-center justify-between gap-3"><p className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{pending ? "در حال ارسال…" : "ارسال پیام"}</Button></div></form>;
}

export function ImprovementDecisionPanel({ requestId, status, versionBump = "minor", customVersionLabel = "" }: { requestId: string; status: string; versionBump?: string; customVersionLabel?: string }) {
  const [state, action, pending] = useActionState(decideImprovementAction, initialState);
  const active = status === "open" || status === "changes-requested";
  if (!active) return null;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Textarea name="reason" label="یادداشت تصمیم" placeholder="دلیل پذیرش، رد یا تغییرات مورد نیاز را روشن بنویسید…" rows={4} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select name="versionBump" label="نسخه هنگام پذیرش" defaultValue={versionBump}>
          <option value="patch">Patch · اصلاح کوچک</option>
          <option value="minor">Minor · قابلیت تازه</option>
          <option value="major">Major · تغییر ناسازگار</option>
          <option value="custom">برچسب سفارشی</option>
        </Select>
        <Input name="customVersionLabel" label="برچسب سفارشی" defaultValue={customVersionLabel} placeholder="مثلاً 2.0-beta" dir="ltr" hint="فقط برای حالت سفارشی" />
      </div>
      {state.message ? <p role={state.status === "error" ? "alert" : undefined} className={`text-xs leading-6 ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" name="decision" value="accept" disabled={pending}><Check className="size-4" />پذیرش</Button>
        <Button type="submit" name="decision" value="request-changes" variant="secondary" disabled={pending}><RotateCcw className="size-4" />درخواست تغییر</Button>
        <Button type="submit" name="decision" value="reject" variant="danger" disabled={pending}><X className="size-4" />رد پیشنهاد</Button>
        <Button type="submit" name="decision" value="close" variant="ghost" disabled={pending}><MessageSquareText className="size-4" />بستن</Button>
      </div>
    </form>
  );
}

export function CloseImprovementButton({ requestId }: { requestId: string }) {
  const [, action, pending] = useActionState(decideImprovementAction, initialState);
  return <form action={action}><input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="reason" value="بسته‌شده توسط مشارکت‌کننده" /><Button type="submit" name="decision" value="close" variant="ghost" size="sm" disabled={pending}><X className="size-4" />بستن پیشنهاد</Button></form>;
}
