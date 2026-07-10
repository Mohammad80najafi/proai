"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Gauge, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { analyzePromptAction, type AnalyzerActionState } from "@/features/ai/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form-controls";

const initialState: AnalyzerActionState = { status: "idle" };

export function AnalyzerForm() {
  const [state, action, pending] = useActionState(analyzePromptAction, initialState);
  const [copied, setCopied] = useState(false);

  async function copyEnhanced() {
    if (!state.result?.enhancedPrompt) return;
    await navigator.clipboard.writeText(state.result.enhancedPrompt);
    setCopied(true);
    toast.success("نسخه بهبودیافته کپی شد.");
    window.setTimeout(() => setCopied(false), 1_800);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(440px,1.1fr)]">
      <Card className="h-fit p-5 sm:p-6">
        <form action={action} className="space-y-5">
          <Textarea
            name="prompt"
            label="پرامپت شما"
            placeholder="پرامپتی را که می‌خواهید تحلیل و بهتر شود اینجا بنویسید…"
            hint="متن شما فقط برای انجام تحلیل به ارائه‌دهنده انتخاب‌شده ارسال می‌شود."
            rows={18}
            required
            className="min-h-[350px] technical-content text-[13px]"
          />
          {state.status === "error" ? <p role="alert" className="text-sm text-danger">{state.message}</p> : null}
          <Button type="submit" size="lg" fullWidth disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
            {pending ? "در حال تحلیل…" : "تحلیل و بهبود پرامپت"}
          </Button>
        </form>
      </Card>

      {state.result ? (
        <div className="space-y-5 animate-soft-enter">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary-strong"><Gauge className="size-5" aria-hidden="true" /></div>
                <div><p className="text-sm text-muted">امتیاز کیفیت</p><p className="mt-0.5 text-xs text-faint">{state.result.provider === "local" ? "تحلیل محلی" : state.result.model}</p></div>
              </div>
              <strong className="text-3xl font-black text-primary-strong">{state.result.score.toLocaleString("fa-IR")}<span className="text-sm text-faint">/۱۰۰</span></strong>
            </div>
            <div className="p-5">
              <p className="text-sm leading-8 text-slate-300">{state.result.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {state.result.dimensions.map((dimension) => (
                  <div key={dimension.key} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                    <div className="flex items-center justify-between text-xs"><span>{dimension.label}</span><span className="font-bold text-white">{dimension.score.toLocaleString("fa-IR")}</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary" style={{ width: `${dimension.score}%` }} /></div>
                    <p className="mt-2 text-[11px] leading-5 text-faint">{dimension.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {state.result.suggestions.length ? (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-semibold"><WandSparkles className="size-4 text-warning" aria-hidden="true" /> پیشنهادهای عملی</h2>
              <div className="mt-4 space-y-3">
                {state.result.suggestions.map((suggestion) => (
                  <div key={suggestion.title} className="flex gap-3 rounded-xl bg-white/[0.025] p-3.5">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-warning" />
                    <div><p className="text-sm font-semibold">{suggestion.title}</p><p className="mt-1 text-xs leading-6 text-muted">{suggestion.description}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <h2 className="font-semibold">نسخه بهبودیافته</h2>
              <Button type="button" size="sm" variant="ghost" onClick={copyEnhanced}>
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                {copied ? "کپی شد" : "کپی"}
              </Button>
            </div>
            <pre className="scrollbar-subtle max-h-[520px] overflow-auto whitespace-pre-wrap p-5 text-xs leading-7 text-slate-300">{state.result.enhancedPrompt}</pre>
          </Card>
        </div>
      ) : (
        <Card className="grid min-h-[520px] place-items-center p-8 text-center">
          <div className="max-w-sm"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-strong"><Sparkles className="size-6" /></div><h2 className="mt-5 text-lg font-bold">گزارش تحلیل اینجا ظاهر می‌شود</h2><p className="mt-2 text-sm leading-7 text-muted">شش بُعد اصلی بررسی می‌شود و در پایان یک نسخه آماده استفاده دریافت می‌کنید.</p></div>
        </Card>
      )}
    </div>
  );
}
