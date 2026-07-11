import { GitCompareArrows, Minus, Plus } from "lucide-react";

const fieldLabels: Record<string, string> = {
  title: "عنوان",
  name: "نام مهارت",
  description: "توضیح کوتاه",
  content: "متن پرامپت",
  instructions: "دستورالعمل",
  category: "دسته‌بندی",
  tags: "برچسب‌ها",
  requiredKnowledge: "دانش مورد نیاز",
  workflow: "گردش کار",
  tools: "ابزارها",
  dependencies: "وابستگی‌ها",
  license: "مجوز",
};

type DiffLine = { kind: "same" | "added" | "removed"; value: string };

function printable(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.instruction ?? record.name ?? JSON.stringify(item));
      }
      return String(item ?? "");
    }).join("\n");
  }
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

export function diffLines(beforeValue: unknown, afterValue: unknown): DiffLine[] {
  const before = printable(beforeValue).split("\n");
  const after = printable(afterValue).split("\n");
  if (before.length * after.length > 10_000) {
    return [...before.map((value) => ({ kind: "removed" as const, value })), ...after.map((value) => ({ kind: "added" as const, value }))];
  }
  const table = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) { result.push({ kind: "same", value: before[i] }); i += 1; j += 1; }
    else if (table[i + 1][j] >= table[i][j + 1]) { result.push({ kind: "removed", value: before[i] }); i += 1; }
    else { result.push({ kind: "added", value: after[j] }); j += 1; }
  }
  while (i < before.length) result.push({ kind: "removed", value: before[i++] });
  while (j < after.length) result.push({ kind: "added", value: after[j++] });
  return result;
}

export function SnapshotDiff({ base, proposed, changedPaths }: { base: Record<string, unknown>; proposed: Record<string, unknown>; changedPaths: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><GitCompareArrows className="size-4 text-primary-strong" /><h2 className="font-semibold">مقایسه با نسخه پایه</h2></div>
        <div className="flex items-center gap-3 text-[11px]"><span className="flex items-center gap-1 text-red-300"><Minus className="size-3" />حذف‌شده</span><span className="flex items-center gap-1 text-emerald-300"><Plus className="size-3" />افزوده‌شده</span></div>
      </div>
      {changedPaths.map((path) => (
        <section key={path} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#080d16]">
          <header className="border-b border-white/[0.07] bg-white/[0.035] px-4 py-2.5 text-xs font-semibold text-slate-300">{fieldLabels[path] ?? path}</header>
          <div className="max-h-[32rem] overflow-auto py-1 font-mono text-[12px] leading-6" dir="auto">
            {diffLines(base[path], proposed[path]).map((line, index) => (
              <div key={`${line.kind}-${index}`} className={`grid grid-cols-[34px_1fr] px-2 ${line.kind === "added" ? "bg-emerald-500/[0.09] text-emerald-100" : line.kind === "removed" ? "bg-red-500/[0.09] text-red-100" : "text-slate-500"}`}>
                <span className="select-none text-center text-faint">{line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}</span>
                <span className="whitespace-pre-wrap break-words px-2">{line.value || " "}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
