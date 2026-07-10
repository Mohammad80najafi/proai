"use client";

import { useActionState } from "react";
import { LoaderCircle, Shapes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { createSkillAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

export function CreateSkillForm() {
  const [state, action, pending] = useActionState(createSkillAction, initialState);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <Card className="space-y-6 p-5 sm:p-7">
        <Input name="name" label="نام مهارت" placeholder="مثلاً: توسعه‌دهنده ارشد فول‌استک" error={state.errors?.name?.[0]} required />
        <Textarea name="description" label="توضیح کوتاه" placeholder="این مهارت چه توانایی‌هایی را به کاربر می‌دهد؟" rows={4} error={state.errors?.description?.[0]} required />
        <Textarea name="instructions" label="دستورالعمل اصلی" placeholder="نقش، اصول تصمیم‌گیری، استانداردها و رفتار مورد انتظار را دقیق بنویسید…" rows={14} className="min-h-[330px] technical-content text-[13px]" error={state.errors?.instructions?.[0]} required />
        <div className="grid gap-5 md:grid-cols-2">
          <Textarea name="requiredKnowledge" label="دانش مورد نیاز" placeholder={'React\nMongoDB\nامنیت وب'} hint="هر مورد در یک خط" rows={6} />
          <Textarea name="tools" label="ابزارها" placeholder={'Git\nDocker\nPlaywright'} hint="هر ابزار در یک خط" rows={6} />
        </div>
        <Textarea name="workflow" label="گردش کار" placeholder={'نیازمندی‌ها را تحلیل کن\nمعماری را طراحی کن\nپیاده‌سازی و تست کن'} hint="هر گام در یک خط؛ ترتیب خطوط حفظ می‌شود." rows={7} error={state.errors?.workflow?.[0]} />
        <Textarea name="dependencies" label="وابستگی‌ها" placeholder={'React Expert@^2\nSecurity Expert@1'} hint="نام مهارت و محدوده نسخه را با @ جدا کنید." rows={5} />
        <Input name="tags" label="برچسب‌ها" placeholder="فول‌استک، React، پایگاه‌داده" hint="با ویرگول جدا کنید." />
      </Card>

      <div className="space-y-4">
        <Card className="space-y-5 p-5">
          <h2 className="font-semibold">تنظیمات انتشار</h2>
          <Select name="visibility" label="دسترسی" defaultValue="public">
            <option value="public">عمومی</option>
            <option value="unlisted">فقط با پیوند</option>
            <option value="draft">پیش‌نویس</option>
          </Select>
          <Select name="license" label="مجوز استفاده" defaultValue="cc-by-4.0">
            <option value="cc-by-4.0">CC BY 4.0</option>
            <option value="cc-by-sa-4.0">CC BY-SA 4.0</option>
            <option value="mit">MIT</option>
            <option value="proprietary">همه حقوق محفوظ</option>
            <option value="unspecified">مشخص‌نشده</option>
          </Select>
        </Card>
        <Card className="border-primary/15 bg-primary-soft p-5 text-xs leading-7 text-muted">
          <div className="mb-2 flex items-center gap-2 font-semibold text-primary-strong"><Shapes className="size-4" /> مهارت ساختاریافته</div>
          مهارت‌ها کد اجرا نمی‌کنند؛ دانش، گردش کار، ابزارها و وابستگی‌ها را به‌شکل امن و نسخه‌پذیر تعریف می‌کنند.
        </Card>
        {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{state.message}</p> : null}
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Shapes className="size-4" />}
          {pending ? "در حال ساخت…" : "ساخت مهارت"}
        </Button>
      </div>
    </form>
  );
}
