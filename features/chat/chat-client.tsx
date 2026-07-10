"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CheckCheck, Circle, LoaderCircle, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRealtime } from "@/features/chat/realtime-provider";
import { scrollChatListToBottom } from "@/features/chat/scroll";
import type { ChatMessage, ChatUser } from "@/features/chat/types";
import { formatRelativeDate } from "@/lib/format";

function upsert(messages: ChatMessage[], next: ChatMessage, userId: string) {
  const normalized = { ...next, own: next.sender?.id === userId };
  const index = messages.findIndex((item) => item.id === next.id || (next.clientNonce && item.clientNonce === next.clientNonce));
  if (index < 0) return [...messages, normalized];
  const copy = [...messages]; copy[index] = normalized; return copy;
}

export function ChatClient({ conversationId, currentUserId, participant, initialMessages }: { conversationId: string; currentUserId: string; participant: ChatUser; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const { socket, connected, activateConversation, clearUnreadConversation } = useRealtime();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const initialScrollRef = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clearUnreadConversation(conversationId);
    fetch("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId }) }).catch(() => undefined);
  }, [clearUnreadConversation, conversationId]);

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
    const handleTyping = (event: { conversationId: string; userId: string; active: boolean }) => {
      if (event.conversationId === conversationId && event.userId === participant.id) {
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
      if (socket.connected) socket.emit("conversation:leave", { conversationId });
      activateConversation(null);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [activateConversation, conversationId, currentUserId, participant.id, socket]);

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
    typingTimer.current = setTimeout(() => socket?.emit("typing", { conversationId, active: false }), 1_400);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = text.trim(); if (!content || sending) return;
    const nonce = crypto.randomUUID();
    const optimistic: ChatMessage = { id: `pending:${nonce}`, conversationId, content, createdAt: new Date().toISOString(), sender: null, own: true, clientNonce: nonce };
    setMessages((items) => [...items, optimistic]); setText(""); setSending(true);
    socket?.emit("typing", { conversationId, active: false });
    if (socket?.connected && joined) {
      socket.emit("message:send", { conversationId, content, clientNonce: nonce }, (ack: { ok: boolean; message?: ChatMessage }) => { if (ack.ok && ack.message) setMessages((items) => upsert(items, ack.message!, currentUserId)); setSending(false); });
    } else {
      try { const response = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId, content, clientNonce: nonce }) }); const data = (await response.json()) as { message?: ChatMessage }; if (data.message) setMessages((items) => upsert(items, data.message!, currentUserId)); } finally { setSending(false); }
    }
  }

  return (
    <section className="flex h-[calc(100vh-9.5rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4 sm:px-5"><div className="flex items-center gap-3"><Avatar src={participant.avatar} fallback={participant.displayName} alt={participant.displayName} size="sm" /><div><h2 className="text-sm font-semibold">{participant.displayName}</h2><p className="mt-0.5 flex items-center gap-1 text-[10px] text-faint"><Circle className={`size-2 ${connected && joined ? "fill-success text-success" : "fill-faint text-faint"}`} />{connected && joined ? "ارتباط زنده" : "حالت پشتیبان"}</p></div></div></header>
      <div ref={messageListRef} role="log" aria-label="پیام‌های گفت‌وگو" aria-live="polite" className="scrollbar-subtle min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">{messages.map((message) => <div key={message.id} className={`flex ${message.own ? "justify-start" : "justify-end"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${message.own ? "rounded-tr-md bg-primary text-white" : "rounded-tl-md border border-white/[0.07] bg-white/[0.045] text-slate-200"}`}><p className="whitespace-pre-wrap" dir="auto">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${message.own ? "text-white/60" : "text-faint"}`}>{formatRelativeDate(message.createdAt)}{message.own ? <CheckCheck className="size-3" /> : null}</span></div></div>)}{typing ? <div className="flex justify-end"><div className="rounded-2xl rounded-tl-md bg-white/[0.045] px-4 py-3 text-xs text-faint">در حال نوشتن<span className="animate-pulse">…</span></div></div> : null}</div>
      <form onSubmit={submit} className="border-t border-white/[0.06] p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={text} onChange={(event) => announceTyping(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} placeholder="پیام بنویسید…" className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-white/[0.09] bg-[#090e18] px-4 py-2.5 text-sm leading-6 outline-none placeholder:text-faint focus:border-primary/50 focus:ring-4 focus:ring-primary/10" /><Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="ارسال پیام">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div></form>
    </section>
  );
}
