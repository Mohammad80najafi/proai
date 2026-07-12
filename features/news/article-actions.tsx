"use client";

import { useState } from "react";
import { Bookmark, Heart, Link2, MessageCircle } from "lucide-react";

export function ArticleActions({ commentCount }: { commentCount: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  const actionClass =
    "inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.045] px-3.5 text-xs text-muted ring-1 ring-white/[0.07] transition-[transform,color,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-white active:scale-95";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="کنش‌های مطلب">
      <button type="button" onClick={() => setLiked((value) => !value)} className={`${actionClass} ${liked ? "text-rose-300" : ""}`} aria-pressed={liked}>
        <Heart className="size-4" fill={liked ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
        {liked ? "پسندیدید" : "پسندیدن"}
      </button>
      <button type="button" onClick={() => setSaved((value) => !value)} className={`${actionClass} ${saved ? "text-primary-strong" : ""}`} aria-pressed={saved}>
        <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
        {saved ? "ذخیره شد" : "ذخیره"}
      </button>
      <button type="button" onClick={copyLink} className={actionClass}>
        <Link2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
        {copied ? "پیوند کپی شد" : "کپی پیوند"}
      </button>
      <a href="#comments" className={actionClass}>
        <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden="true" />
        {commentCount.toLocaleString("fa-IR")} دیدگاه
      </a>
    </div>
  );
}
