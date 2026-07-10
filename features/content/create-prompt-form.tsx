"use client";

import { useActionState } from "react";
import { Braces, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { createPromptAction } from "@/features/content/actions";
import type { ContentActionState } from "@/features/content/mutation-helpers";

const initialState: ContentActionState = { status: "idle" };

export function CreatePromptForm() {
  const [state, action, pending] = useActionState(createPromptAction, initialState);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <Card className="space-y-6 p-5 sm:p-7">
        <Input name="title" label="عنوان پرامپت" placeholder="مثلاً: معمار ارشد سامانه‌های هوش مصنوعی" error={state.errors?.title?.[0]} required />
        <Textarea name="description" label="توضیح کوتاه" placeholder="این پرامپت چه مسئله‌ای را حل می‌کند و برای چه کسی مناسب است؟" rows={4} error={state.errors?.description?.[0]} required />
        <Textarea name="content" label="متن پرامپت" placeholder="نقش، هدف، زمینه، محدودیت‌ها و قالب خروجی را بنویسید…" rows={18} error={state.errors?.content?.[0]} className="min-h-[410px] technical-content text-[13px]" required />
        <Input name="tags" label="برچسب‌ها" placeholder="معماری، امنیت، مقیاس‌پذیری" hint="برچسب‌ها را با ویرگول جدا کنید؛ حداکثر ۱۲ مورد." error={state.errors?.tags?.[0]} />
      </Card>

      <div className="space-y-4">
        <Card className="space-y-5 p-5">
          <h2 className="font-semibold">تنظیمات انتشار</h2>
          <Select name="category" label="دسته‌بندی" defaultValue="development" error={state.errors?.category?.[0]}>
            <option value="development">برنامه‌نویسی</option>
            <option value="writing">تولید محتوا</option>
            <option value="design">طراحی</option>
            <option value="business">کسب‌وکار</option>
            <option value="education">آموزش</option>
            <option value="research">تحقیق</option>
            <option value="productivity">بهره‌وری</option>
            <option value="other">سایر</option>
          </Select>
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
          <div className="mb-2 flex items-center gap-2 font-semibold text-primary-strong"><Braces className="size-4" /> نسخه‌پذیر از ابتدا</div>
          انتشار، نسخه رسمی ۱ را می‌سازد. همه تغییرات بعدی تاریخچه مستقل و قابل استناد خواهند داشت.
        </Card>
        {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{state.message}</p> : null}
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Braces className="size-4" />}
          {pending ? "در حال ساخت…" : "ساخت پرامپت"}
        </Button>
      </div>
    </form>
  );
}
