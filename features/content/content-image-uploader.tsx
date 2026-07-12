"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

import type { ContentImage } from "@/features/shared/types";

const MAX_IMAGES = 8;

export function ContentImageUploader({ name = "images" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ContentImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const available = MAX_IMAGES - images.length;
    const selected = Array.from(files).slice(0, available);
    if (selected.length < files.length) setError(`حداکثر ${MAX_IMAGES.toLocaleString("fa-IR")} تصویر مجاز است.`);
    else setError("");

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        selected.map(async (file) => {
          const body = new FormData();
          body.set("image", file);
          const response = await fetch("/api/content/images", { method: "POST", body });
          if (!response.ok) throw new Error("upload failed");
          const result = (await response.json()) as { url?: string };
          if (!result.url) throw new Error("upload failed");
          return { url: result.url, alt: "" } satisfies ContentImage;
        }),
      );
      setImages((current) => [...current, ...uploaded].slice(0, MAX_IMAGES));
    } catch {
      setError("بارگذاری تصویر انجام نشد. فایل PNG، JPG یا WebP تا حجم ۶ مگابایت انتخاب کنید.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section className="rounded-[1.5rem] bg-white/[0.03] p-4 ring-1 ring-white/[0.07] sm:p-5" aria-labelledby={`${name}-title`}>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id={`${name}-title`} className="text-sm font-bold">تصاویر و نمونه‌های بصری</h2>
          <p className="mt-1 text-[11px] leading-6 text-faint">تا ۸ تصویر؛ اولین تصویر به‌عنوان جلد کارت نمایش داده می‌شود.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2.5 text-xs font-semibold text-slate-200 ring-1 ring-white/[0.08] transition-colors duration-500 hover:bg-white/[0.11]">
          {uploading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden="true" />}
          {uploading ? "در حال بارگذاری…" : "افزودن تصویر"}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" disabled={uploading || images.length >= MAX_IMAGES} onChange={(event) => upload(event.target.files)} />
        </label>
      </div>

      {images.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div key={image.url} className="overflow-hidden rounded-2xl bg-[#090e17] ring-1 ring-white/[0.07]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={image.url} alt={image.alt} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" unoptimized />
                {index === 0 ? <span className="absolute end-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-semibold text-white">تصویر جلد</span> : null}
              </div>
              <div className="space-y-2 p-3">
                <input
                  value={image.alt}
                  onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item))}
                  placeholder="توضیح تصویر برای دسترس‌پذیری"
                  maxLength={200}
                  className="h-9 w-full rounded-xl bg-white/[0.045] px-3 text-[11px] text-slate-200 outline-none ring-1 ring-white/[0.07] focus:ring-primary/60"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-white/[0.06] hover:text-white disabled:opacity-25" aria-label="انتقال تصویر به راست"><ArrowRight className="size-3.5" strokeWidth={1.4} /></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-white/[0.06] hover:text-white disabled:opacity-25" aria-label="انتقال تصویر به چپ"><ArrowLeft className="size-3.5" strokeWidth={1.4} /></button>
                  </div>
                  <button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-danger/10 hover:text-danger" aria-label="حذف تصویر"><Trash2 className="size-3.5" strokeWidth={1.4} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 grid min-h-40 w-full place-items-center rounded-2xl border border-dashed border-white/[0.1] bg-black/10 text-center transition-colors duration-500 hover:border-primary/35 hover:bg-primary/[0.035]">
          <span>
            <ImagePlus className="mx-auto size-6 text-faint" strokeWidth={1.3} aria-hidden="true" />
            <span className="mt-3 block text-xs font-semibold text-slate-300">تصویر، نمودار یا نمونه خروجی اضافه کنید</span>
            <span className="mt-1 block text-[10px] text-faint">PNG، JPG یا WebP</span>
          </span>
        </button>
      )}
      {error ? <p className="mt-3 text-xs leading-6 text-danger" role="alert">{error}</p> : null}
    </section>
  );
}
