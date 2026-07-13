"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, LoaderCircle, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import {
  resolveReportAction,
  updateContentStatusAction,
  updateUserRoleAction,
  updateUserStatusAction,
  type AdminActionState,
} from "@/features/admin/actions";

const initialState: AdminActionState = { status: "idle" };

function useAdminActionToast(state: AdminActionState) {
  const lastMessage = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!state.message || state.message === lastMessage.current) return;
    lastMessage.current = state.message;
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state.message, state.status]);
}

export function UserStatusControl({
  userId,
  status,
  disabled = false,
}: {
  userId: string;
  status: "active" | "suspended" | "deleted";
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserStatusAction, initialState);
  useAdminActionToast(state);
  const nextStatus = status === "active" ? "suspended" : "active";
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button
        type="submit"
        size="sm"
        variant={status === "active" ? "danger" : "outline"}
        disabled={disabled || status === "deleted" || pending}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : status === "active" ? (
          <UserX className="size-3.5" aria-hidden />
        ) : (
          <UserCheck className="size-3.5" aria-hidden />
        )}
        {status === "active" ? "تعلیق" : "فعال‌سازی"}
      </Button>
    </form>
  );
}

export function UserRoleControl({
  userId,
  roles,
  disabled = false,
}: {
  userId: string;
  roles: string[];
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserRoleAction, initialState);
  useAdminActionToast(state);
  const role = roles.includes("admin") ? "admin" : roles.includes("moderator") ? "moderator" : "user";
  return (
    <form action={action} className="flex items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select id={`user-role-${userId}`} name="role" defaultValue={role} className="h-8 min-w-28 py-0 text-xs" disabled={disabled || pending} aria-label="سطح دسترسی">
        <option value="user">کاربر</option>
        <option value="moderator">ناظر</option>
        <option value="admin">مدیر</option>
      </Select>
      <Button type="submit" size="sm" variant="ghost" disabled={disabled || pending} aria-label="ذخیره سطح دسترسی">
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
      </Button>
    </form>
  );
}

export function ContentStatusControl({
  targetId,
  targetType,
  status,
}: {
  targetId: string;
  targetType: "Prompt" | "Skill";
  status: "visible" | "under-review" | "removed";
}) {
  const [state, action, pending] = useActionState(updateContentStatusAction, initialState);
  useAdminActionToast(state);
  return (
    <form action={action} className="flex items-end gap-2">
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetType" value={targetType} />
      <Select id={`content-status-${targetId}`} name="status" defaultValue={status} className="h-8 min-w-32 py-0 text-xs" disabled={pending} aria-label="وضعیت نظارت">
        <option value="visible">قابل نمایش</option>
        <option value="under-review">در حال بررسی</option>
        <option value="removed">حذف از نمایش</option>
      </Select>
      <Button type="submit" size="sm" variant="ghost" disabled={pending} aria-label="ذخیره وضعیت محتوا">
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
      </Button>
    </form>
  );
}

export function ReportResolutionControl({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(resolveReportAction, initialState);
  useAdminActionToast(state);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
      <label className="grid gap-1.5 text-[11px] text-slate-500">
        یادداشت رسیدگی
        <input
          name="resolution"
          maxLength={2000}
          placeholder="نتیجه بررسی را کوتاه ثبت کنید"
          className="h-9 rounded-xl border border-white/[0.09] bg-[#090e18] px-3 text-xs text-slate-100 outline-none placeholder:text-slate-700 focus:border-orange-400/50 focus:ring-4 focus:ring-orange-500/10"
        />
      </label>
      <input type="hidden" name="reportId" value={reportId} />
      <Select id={`report-decision-${reportId}`} name="decision" defaultValue="resolved" className="h-9 py-0 text-xs" disabled={pending} aria-label="تصمیم گزارش">
        <option value="resolved">رسیدگی شد</option>
        <option value="dismissed">رد گزارش</option>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <ShieldAlert className="size-3.5" aria-hidden />}
        ثبت نتیجه
      </Button>
    </form>
  );
}
