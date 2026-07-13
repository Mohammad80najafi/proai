"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircleReply } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/features/content/comment-form";
import type { CommentDTO } from "@/features/shared/types";
import { formatRelativeDate } from "@/lib/format";

type CommentThreadProps = {
  comments: CommentDTO[];
  targetType: "Prompt" | "Skill";
  targetId: string;
  canReply: boolean;
  loginHref: string;
};

type CommentItemProps = Omit<CommentThreadProps, "comments"> & {
  comment: CommentDTO;
  nested?: boolean;
};

function CommentItem({
  comment,
  targetType,
  targetId,
  canReply,
  loginHref,
  nested = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <article
      id={`comment-${comment.id}`}
      className={nested ? "flex gap-3 py-3" : "py-5 first:pt-0 last:pb-0"}
    >
      <div className={nested ? "contents" : "flex gap-3"}>
        <Avatar
          src={comment.author.avatar}
          fallback={comment.author.displayName}
          alt={comment.author.displayName}
          size={nested ? "xs" : "sm"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/users/${comment.author.username}`}
              className="text-sm font-semibold text-slate-100 transition-colors hover:text-primary-strong"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-[10px] text-faint">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7 text-slate-300" dir="auto">
            {comment.content}
          </p>
          <div className="mt-1.5">
            {canReply ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ms-3 h-7 px-2.5 text-[11px]"
                aria-expanded={showReplyForm}
                onClick={() => setShowReplyForm((current) => !current)}
              >
                <MessageCircleReply className="size-3.5" aria-hidden />
                پاسخ
              </Button>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] text-muted transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <MessageCircleReply className="size-3.5" aria-hidden />
                ورود برای پاسخ
              </Link>
            )}
          </div>
          {showReplyForm ? (
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/10 p-3">
              <CommentForm
                targetType={targetType}
                targetId={targetId}
                parentId={comment.id}
                replyingTo={comment.author.username}
                onCancel={() => setShowReplyForm(false)}
                onPublished={() => setShowReplyForm(false)}
              />
            </div>
          ) : null}

          {comment.replies.length ? (
            <div className="mt-3 border-s border-primary/25 ps-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  targetType={targetType}
                  targetId={targetId}
                  canReply={canReply}
                  loginHref={loginHref}
                  nested
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CommentThread({
  comments,
  targetType,
  targetId,
  canReply,
  loginHref,
}: CommentThreadProps) {
  if (!comments.length) {
    return <p className="py-5 text-center text-sm text-faint">هنوز دیدگاهی ثبت نشده است.</p>;
  }

  return (
    <div className="divide-y divide-white/[0.06]">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          targetType={targetType}
          targetId={targetId}
          canReply={canReply}
          loginHref={loginHref}
        />
      ))}
    </div>
  );
}
