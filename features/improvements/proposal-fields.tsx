import { Input, Select, Textarea } from "@/components/ui/form-controls";

type Errors = Record<string, string[] | undefined> | undefined;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function lines(value: unknown, pick?: (item: Record<string, unknown>) => string) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => {
    if (typeof item === "string") return item;
    return item && typeof item === "object" && pick ? pick(item as Record<string, unknown>) : "";
  }).filter(Boolean).join("\n");
}

export function ProposalFields({
  targetType,
  snapshot,
  errors,
}: {
  targetType: "Prompt" | "Skill";
  snapshot: Record<string, unknown>;
  errors?: Errors;
}) {
  if (targetType === "Prompt") {
    return (
      <div className="space-y-5">
        <Input name="title" label="عنوان پرامپت پیشنهادی" defaultValue={text(snapshot.title)} error={errors?.title?.[0]} required />
        <Textarea name="description" label="توضیح کوتاه" defaultValue={text(snapshot.description)} rows={4} error={errors?.description?.[0]} required />
        <Textarea name="content" label="متن کامل پرامپت" defaultValue={text(snapshot.content)} rows={18} className="min-h-[410px] technical-content text-[13px]" error={errors?.content?.[0]} required />
        <div className="grid gap-5 md:grid-cols-2">
          <Input name="tags" label="برچسب‌ها" defaultValue={lines(snapshot.tags).replaceAll("\n", "، ")} hint="حداکثر ۱۲ برچسب، جداشده با ویرگول" error={errors?.tags?.[0]} />
          <Select name="category" label="دسته‌بندی" defaultValue={text(snapshot.category) || "other"} error={errors?.category?.[0]}>
            <option value="development">برنامه‌نویسی</option><option value="writing">تولید محتوا</option><option value="design">طراحی</option><option value="business">کسب‌وکار</option><option value="education">آموزش</option><option value="research">تحقیق</option><option value="productivity">بهره‌وری</option><option value="other">سایر</option>
          </Select>
        </div>
        <Select name="license" label="مجوز پیشنهادی" defaultValue={text(snapshot.license) || "cc-by-4.0"}>
          <option value="cc-by-4.0">CC BY 4.0</option><option value="cc-by-sa-4.0">CC BY-SA 4.0</option><option value="mit">MIT</option><option value="proprietary">همه حقوق محفوظ</option><option value="unspecified">مشخص‌نشده</option>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Input name="name" label="نام مهارت پیشنهادی" defaultValue={text(snapshot.name)} error={errors?.name?.[0]} required />
      <Textarea name="description" label="توضیح کوتاه" defaultValue={text(snapshot.description)} rows={4} error={errors?.description?.[0]} required />
      <Textarea name="instructions" label="دستورالعمل کامل" defaultValue={text(snapshot.instructions)} rows={16} className="min-h-[370px] technical-content text-[13px]" error={errors?.instructions?.[0]} required />
      <div className="grid gap-5 md:grid-cols-2">
        <Textarea name="requiredKnowledge" label="دانش مورد نیاز" defaultValue={lines(snapshot.requiredKnowledge)} hint="هر مورد در یک خط" rows={6} />
        <Textarea name="tools" label="ابزارها" defaultValue={lines(snapshot.tools)} hint="هر ابزار در یک خط" rows={6} />
      </div>
      <Textarea name="workflow" label="گردش کار" defaultValue={lines(snapshot.workflow, (item) => text(item.instruction))} hint="هر گام در یک خط" rows={8} error={errors?.workflow?.[0]} />
      <Textarea name="dependencies" label="وابستگی‌ها" defaultValue={lines(snapshot.dependencies, (item) => `${text(item.name)}@${text(item.versionRange) || "*"}`)} hint="نام مهارت و نسخه را با @ جدا کنید" rows={5} />
      <div className="grid gap-5 md:grid-cols-2">
        <Input name="tags" label="برچسب‌ها" defaultValue={lines(snapshot.tags).replaceAll("\n", "، ")} />
        <Select name="license" label="مجوز پیشنهادی" defaultValue={text(snapshot.license) || "cc-by-4.0"}>
          <option value="cc-by-4.0">CC BY 4.0</option><option value="cc-by-sa-4.0">CC BY-SA 4.0</option><option value="mit">MIT</option><option value="proprietary">همه حقوق محفوظ</option><option value="unspecified">مشخص‌نشده</option>
        </Select>
      </div>
    </div>
  );
}
