"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";

import type { ContentImage } from "@/features/shared/types";

export function ContentImageGallery({
  images,
  title,
}: {
  images: ContentImage[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;
  const active = images[selected] ?? images[0];

  return (
    <section
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]"
      aria-label={`تصاویر ${title}`}>
      <div className="relative h-[clamp(16rem,40vw,26rem)] overflow-hidden rounded-[calc(1.75rem-0.375rem)] bg-[#090e17]">
        <Image
          src={active.url}
          alt={active.alt || title}
          fill
          sizes="(max-width: 1280px) 100vw, 900px"
          className="object-contain"
          unoptimized
        />
        {images.length > 1 ? (
          <span className="absolute end-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-[10px] text-white">
            <Images className="size-3.5" strokeWidth={1.5} />
            {images.length.toLocaleString("fa-IR")} تصویر
          </span>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="scrollbar-subtle flex gap-2 overflow-x-auto px-1 pb-1 pt-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelected(index)}
              className={`relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition-opacity duration-500 ${selected === index ? "ring-primary opacity-100" : "ring-transparent opacity-55 hover:opacity-90"}`}
              aria-label={`نمایش تصویر ${(index + 1).toLocaleString("fa-IR")}`}>
              <Image
                src={image.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
