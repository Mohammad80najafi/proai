"use client";

import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCheck,
  Circle,
  LoaderCircle,
  MessageCircle,
  ImagePlus,
  Send,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRealtime } from "@/features/chat/realtime-provider";
import { scrollChatListToBottom } from "@/features/chat/scroll";
import type { ChatMessage, ChatUser } from "@/features/chat/types";
import { formatRelativeDate } from "@/lib/format";

function upsert(messages: ChatMessage[], next: ChatMessage, userId: string) {
  const normalized = { ...next, own: next.sender?.id === userId };
  const index = messages.findIndex(
    (item) =>
      item.id === next.id ||
      (next.clientNonce && item.clientNonce === next.clientNonce),
  );
  if (index < 0) return [...messages, normalized];
  const copy = [...messages];
  copy[index] = normalized;
  return copy;
}

export function ChatClient({
  conversationId,
  currentUserId,
  participant,
  initialMessages,
  backHref = "/messages",
}: {
  conversationId: string;
  currentUserId: string;
  participant: ChatUser;
  initialMessages: ChatMessage[];
  backHref?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
    width: number | null;
    height: number | null;
  } | null>(null);
  const [composerError, setComposerError] = useState("");
  const [joined, setJoined] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const {
    socket,
    isUserOnline,
    activateConversation,
    clearUnreadConversation,
  } = useRealtime();
  const participantOnline = isUserOnline(participant.id);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const initialScrollRef = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    clearUnreadConversation(conversationId);
    void fetch("/api/messages", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as {
          notificationsRead?: number;
        };
        if (cancelled) return;
        clearUnreadConversation(conversationId, result.notificationsRead ?? 0);
        startTransition(() => router.refresh());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clearUnreadConversation, conversationId, router]);

  useEffect(() => {
    if (!socket) return;
    let disposed = false;
    const join = () => {
      setJoined(false);
      socket.emit(
        "conversation:join",
        { conversationId },
        (ack: { ok: boolean }) => {
          if (disposed) return;
          setJoined(ack.ok);
          if (ack.ok) activateConversation(conversationId);
        },
      );
    };
    const handleDisconnect = () => setJoined(false);
    const handleMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((items) => upsert(items, message, currentUserId));
      if (message.sender?.id !== currentUserId) {
        socket.emit("conversation:read", { conversationId });
      }
    };
    const handleTyping = (event: {
      conversationId: string;
      userId: string;
      active: boolean;
    }) => {
      if (
        event.conversationId === conversationId &&
        event.userId === participant.id
      ) {
        setTyping(event.active);
      }
    };

    socket.on("connect", join);
    socket.on("disconnect", handleDisconnect);
    socket.on("message:new", handleMessage);
    socket.on("typing", handleTyping);
    if (socket.connected) join();

    return () => {
      disposed = true;
      socket.off("connect", join);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleMessage);
      socket.off("typing", handleTyping);
      if (socket.connected)
        socket.emit("conversation:leave", { conversationId });
      activateConversation(null);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [
    activateConversation,
    conversationId,
    currentUserId,
    participant.id,
    socket,
  ]);

  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    scrollChatListToBottom(list, initialScrollRef.current ? "auto" : "smooth");
    initialScrollRef.current = false;
  }, [messages.length, typing]);

  function announceTyping(value: string) {
    setText(value);
    socket?.emit("typing", { conversationId, active: Boolean(value.trim()) });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket?.emit("typing", { conversationId, active: false }),
      1_400,
    );
  }

  function resizeComposer(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }

  function clearSelectedImage() {
    if (selectedImage) URL.revokeObjectURL(selectedImage.preview);
    setSelectedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function selectImage(file: File | undefined) {
    setComposerError("");
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setComposerError("فقط تصویر PNG، JPEG یا WebP قابل ارسال است.");
      return;
    }
    if (file.size > 4_000_000) {
      setComposerError("حجم تصویر باید کمتر از ۴ مگابایت باشد.");
      return;
    }
    if (selectedImage) URL.revokeObjectURL(selectedImage.preview);
    const preview = URL.createObjectURL(file);
    setSelectedImage({ file, preview, width: null, height: null });
    const probe = document.createElement("img");
    probe.onload = () => {
      setSelectedImage((current) => current?.preview === preview
        ? { ...current, width: probe.naturalWidth, height: probe.naturalHeight }
        : current);
    };
    probe.src = preview;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if ((!content && !selectedImage) || sending) return;
    setComposerError("");
    setSending(true);
    let image: ChatMessage["image"] = null;
    if (selectedImage) {
      try {
        const formData = new FormData();
        formData.set("conversationId", conversationId);
        formData.set("image", selectedImage.file);
        const uploadResponse = await fetch("/api/messages/images", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error("upload failed");
        const uploaded = (await uploadResponse.json()) as { url?: string };
        if (!uploaded.url) throw new Error("upload failed");
        image = {
          url: uploaded.url,
          width: selectedImage.width,
          height: selectedImage.height,
        };
      } catch {
        setComposerError("ارسال تصویر انجام نشد. دوباره تلاش کنید.");
        setSending(false);
        return;
      }
    }
    const nonce = crypto.randomUUID();
    const optimistic: ChatMessage = {
      id: `pending:${nonce}`,
      conversationId,
      content,
      image,
      createdAt: new Date().toISOString(),
      sender: null,
      own: true,
      clientNonce: nonce,
    };
    setMessages((items) => [...items, optimistic]);
    setText("");
    clearSelectedImage();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    socket?.emit("typing", { conversationId, active: false });
    if (socket?.connected && joined) {
      socket.emit(
        "message:send",
        { conversationId, content, image, clientNonce: nonce },
        (ack: { ok: boolean; message?: ChatMessage }) => {
          if (ack.ok && ack.message)
            setMessages((items) => upsert(items, ack.message!, currentUserId));
          if (!ack.ok) {
            setMessages((items) => items.filter((item) => item.clientNonce !== nonce));
            setComposerError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
          }
          setSending(false);
        },
      );
    } else {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversationId, content, image, clientNonce: nonce }),
        });
        if (!response.ok) throw new Error("send failed");
        const data = (await response.json()) as { message?: ChatMessage };
        if (data.message)
          setMessages((items) => upsert(items, data.message!, currentUserId));
      } catch {
        setMessages((items) => items.filter((item) => item.clientNonce !== nonce));
        setComposerError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
      } finally {
        setSending(false);
      }
    }
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0d121e]/90 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href={backHref}
            scroll={false}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 outline-none transition-colors hover:bg-white/[0.06] hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-primary/70 lg:hidden"
            aria-label="بازگشت به فهرست گفت‌وگوها">
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          <Avatar
            src={participant.avatar}
            fallback={participant.displayName}
            alt={participant.displayName}
            size="md"
          />
          <div className="min-w-0">
            <Link
              href={`/users/${participant.username}`}
              className="block truncate text-sm font-semibold text-slate-100 outline-none hover:text-primary-strong focus-visible:underline">
              {participant.displayName}
            </Link>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
              <Circle
                className={`size-2 ${participantOnline ? "fill-success text-success" : "fill-faint text-faint"}`}
                aria-hidden="true"
              />
              {participantOnline ? "آنلاین" : "آفلاین"}
              <span aria-hidden="true" className="text-faint">
                ·
              </span>
              <span dir="ltr" className="truncate text-faint">
                @{participant.username}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div
        ref={messageListRef}
        role="log"
        aria-label="پیام‌های گفت‌وگو"
        aria-live="polite"
        className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-3">
          {!messages.length ? (
            <div className="my-auto py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-primary-strong">
                <MessageCircle className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-200">
                آغاز گفت‌وگو
              </p>
              <p className="mt-1 text-xs leading-6 text-muted">
                اولین پیام را برای {participant.displayName} بنویسید.
              </p>
            </div>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.own ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm sm:max-w-[72%] ${message.own ? "rounded-tr-md bg-primary text-white shadow-indigo-950/20" : "rounded-tl-md border border-white/[0.08] bg-white/[0.055] text-slate-200"}`}>
                {message.image ? (
                  <a
                    href={message.image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-1 block overflow-hidden rounded-xl outline-none ring-white/50 focus-visible:ring-2">
                    <Image
                      src={message.image.url}
                      alt={message.content || "تصویر ارسالی"}
                      width={message.image.width ?? 960}
                      height={message.image.height ?? 720}
                      unoptimized
                      className="max-h-[28rem] w-auto max-w-full object-contain"
                    />
                  </a>
                ) : null}
                {message.content ? (
                  <p className="whitespace-pre-wrap" dir="auto">
                    {message.content}
                  </p>
                ) : null}
                <span
                  className={`mt-1 flex items-center justify-end gap-1 text-[11px] tabular-nums ${message.own ? "text-white/65" : "text-faint"}`}>
                  {formatRelativeDate(message.createdAt)}
                  {message.own ? (
                    <CheckCheck className="size-3" aria-label="ارسال‌شده" />
                  ) : null}
                </span>
              </div>
            </div>
          ))}
          {typing ? (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.045] px-4 py-3 text-xs text-muted">
                در حال نوشتن
                <span className="animate-pulse motion-reduce:animate-none">
                  …
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 border-t border-white/[0.07] bg-[#0b101a]/95 px-3 py-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto w-full max-w-4xl">
          {selectedImage ? (
            <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.045] p-2">
              <Image
                src={selectedImage.preview}
                alt="پیش‌نمایش تصویر انتخاب‌شده"
                width={72}
                height={72}
                unoptimized
                className="size-16 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200" dir="auto">{selectedImage.file.name}</p>
                <p className="mt-1 text-[10px] text-faint">{(selectedImage.file.size / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت</p>
              </div>
              <button
                type="button"
                onClick={clearSelectedImage}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted outline-none transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-primary/70"
                aria-label="حذف تصویر انتخاب‌شده">
                <X className="size-4" />
              </button>
            </div>
          ) : null}
          <label htmlFor="message-composer" className="sr-only">
            متن پیام
          </label>
          <div className="flex items-end gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={sending}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-[#080d16] text-muted outline-none transition-colors hover:border-white/[0.18] hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="افزودن تصویر">
              <ImagePlus className="size-4" />
            </button>
            <textarea
              ref={textareaRef}
              id="message-composer"
              value={text}
              onChange={(event) => {
                announceTyping(event.target.value);
                resizeComposer(event.currentTarget);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="پیام بنویسید…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-white/[0.1] bg-[#080d16] px-4 py-2.5 text-base leading-6 text-slate-100 outline-none transition-colors placeholder:text-faint hover:border-white/[0.16] focus:border-primary/55 focus:ring-4 focus:ring-primary/10 sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11"
              disabled={(!text.trim() && !selectedImage) || sending}
              aria-label="ارسال پیام">
              {sending ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          {composerError ? <p role="alert" className="mt-2 text-xs text-danger">{composerError}</p> : null}
          <p className="mt-2 hidden text-[10px] text-faint sm:block">
            Enter برای ارسال · Shift + Enter برای خط جدید
          </p>
        </div>
      </form>
    </section>
  );
}
