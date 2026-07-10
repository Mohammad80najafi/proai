"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import type { ContentActionState } from "@/features/content/mutation-helpers";
import { updateProfileAction } from "@/features/social/settings-actions";

const initialState: ContentActionState = { status: "idle" };

export function SettingsForm({ profile }: { profile: { displayName: string; bio: string; messagingPolicy: string } }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  return <form action={action} className="space-y-6"><Input name="displayName" label="نام نمایشی" defaultValue={profile.displayName} required /><Textarea name="bio" label="معرفی کوتاه" defaultValue={profile.bio} rows={5} hint="حداکثر ۳۲۰ نویسه" /><Input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" label="تصویر پروفایل" hint="PNG، JPEG یا WebP؛ حداکثر ۱٫۵ مگابایت" /><Select name="messagingPolicy" label="چه کسانی می‌توانند گفت‌وگو را شروع کنند؟" defaultValue={profile.messagingPolicy}><option value="everyone">همه کاربران</option><option value="following">افرادی که دنبال می‌کنم</option><option value="mutual">دنبال‌کردن دوطرفه</option><option value="nobody">هیچ‌کس</option></Select>{state.message ? <p role={state.status === "error" ? "alert" : undefined} className={`rounded-xl p-3 text-sm ${state.status === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{state.message}</p> : null}<Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "در حال ذخیره…" : "ذخیره تغییرات"}</Button></form>;
}
