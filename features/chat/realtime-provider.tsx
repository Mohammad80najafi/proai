"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

import type {
  ChatMessageNotification,
  ConversationReadEvent,
  PresenceEvent,
  PresenceSnapshot,
  UnreadCounts,
} from "@/features/chat/types";

type RealtimeContextValue = {
  socket: Socket | null;
  connected: boolean;
  unreadConversationCount: number;
  notificationCount: number;
  isUserOnline: (userId: string) => boolean;
  activateConversation: (conversationId: string | null) => void;
  clearUnreadConversation: (conversationId: string, notificationsRead?: number) => void;
  refreshUnreadCounts: () => Promise<void>;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({
  children,
  enabled,
  initialUnreadConversationIds,
  initialNotificationCount,
}: {
  children: React.ReactNode;
  enabled: boolean;
  initialUnreadConversationIds: string[];
  initialNotificationCount: number;
}) {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadConversationIds, setUnreadConversationIds] = useState(
    () => new Set(initialUnreadConversationIds),
  );
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());
  const activeConversationRef = useRef<string | null>(null);
  const seenMessageIdsRef = useRef(new Set<string>());
  const refreshSequenceRef = useRef(0);

  const clearUnreadConversation = useCallback((conversationId: string, notificationsRead = 0) => {
    setUnreadConversationIds((current) => {
      if (!current.has(conversationId)) return current;
      const next = new Set(current);
      next.delete(conversationId);
      return next;
    });
    if (notificationsRead > 0) {
      setNotificationCount((count) => Math.max(0, count - notificationsRead));
    }
  }, []);

  const activateConversation = useCallback((conversationId: string | null) => {
    activeConversationRef.current = conversationId;
    if (conversationId) clearUnreadConversation(conversationId);
  }, [clearUnreadConversation]);

  const refreshUnreadCounts = useCallback(async () => {
    const sequence = ++refreshSequenceRef.current;
    try {
      const response = await fetch("/api/unread-counts", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const data = (await response.json()) as Partial<UnreadCounts>;
      if (
        sequence !== refreshSequenceRef.current ||
        !Array.isArray(data.unreadConversationIds) ||
        typeof data.notificationCount !== "number"
      ) {
        return;
      }
      setUnreadConversationIds(new Set(data.unreadConversationIds));
      setNotificationCount(data.notificationCount);
    } catch {
      // The initial server-rendered counts remain usable while offline.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const realtimeSocket = io(
      process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001",
      {
        withCredentials: true,
        transports: ["websocket", "polling"],
      },
    );
    const handleConnect = () => {
      setSocket(realtimeSocket);
      setConnected(true);
      void refreshUnreadCounts();
    };
    const handleDisconnect = () => {
      setConnected(false);
      setOnlineUserIds(new Set());
    };
    const handlePresenceSnapshot = (event: PresenceSnapshot) => {
      if (!Array.isArray(event?.userIds)) return;
      setOnlineUserIds(new Set(event.userIds.filter((userId) => typeof userId === "string")));
    };
    const handlePresence = (event: PresenceEvent) => {
      if (typeof event?.userId !== "string" || typeof event.online !== "boolean") return;
      setOnlineUserIds((current) => {
        const alreadyMatches = event.online
          ? current.has(event.userId)
          : !current.has(event.userId);
        if (alreadyMatches) return current;

        const next = new Set(current);
        if (event.online) next.add(event.userId);
        else next.delete(event.userId);
        return next;
      });
    };
    const handleMessageNotification = (event: ChatMessageNotification) => {
      const messageId = event?.message?.id;
      const conversationId = event?.message?.conversationId;
      if (!messageId || !conversationId || seenMessageIdsRef.current.has(messageId)) return;

      if (seenMessageIdsRef.current.size >= 500) {
        const oldestMessageId = seenMessageIdsRef.current.values().next().value;
        if (oldestMessageId) seenMessageIdsRef.current.delete(oldestMessageId);
      }
      seenMessageIdsRef.current.add(messageId);
      setNotificationCount((count) => count + 1);
      if (activeConversationRef.current === conversationId) return;

      setUnreadConversationIds((current) => {
        if (current.has(conversationId)) return current;
        const next = new Set(current);
        next.add(conversationId);
        return next;
      });

      const senderName = event.message.sender?.displayName ?? "یک کاربر";
      toast(`پیام تازه از ${senderName}`, {
        description: event.message.content.slice(0, 140),
        action: {
          label: "مشاهده",
          onClick: () => router.push(event.href),
        },
      });
    };
    const handleConversationRead = (event: ConversationReadEvent) => {
      if (event?.conversationId) {
        clearUnreadConversation(event.conversationId, event.notificationsRead);
      }
    };
    const handleFocus = () => void refreshUnreadCounts();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshUnreadCounts();
    };

    realtimeSocket.on("connect", handleConnect);
    realtimeSocket.on("disconnect", handleDisconnect);
    realtimeSocket.on("connect_error", handleDisconnect);
    realtimeSocket.on("presence:snapshot", handlePresenceSnapshot);
    realtimeSocket.on("presence", handlePresence);
    realtimeSocket.on("message:notification", handleMessageNotification);
    realtimeSocket.on("conversation:read", handleConversationRead);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      realtimeSocket.off("connect", handleConnect);
      realtimeSocket.off("disconnect", handleDisconnect);
      realtimeSocket.off("connect_error", handleDisconnect);
      realtimeSocket.off("presence:snapshot", handlePresenceSnapshot);
      realtimeSocket.off("presence", handlePresence);
      realtimeSocket.off("message:notification", handleMessageNotification);
      realtimeSocket.off("conversation:read", handleConversationRead);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      realtimeSocket.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUserIds(new Set());
    };
  }, [clearUnreadConversation, enabled, refreshUnreadCounts, router]);

  const value = useMemo<RealtimeContextValue>(() => ({
    socket,
    connected,
    unreadConversationCount: unreadConversationIds.size,
    notificationCount,
    isUserOnline: (userId) => onlineUserIds.has(userId),
    activateConversation,
    clearUnreadConversation,
    refreshUnreadCounts,
  }), [
    activateConversation,
    clearUnreadConversation,
    connected,
    notificationCount,
    onlineUserIds,
    refreshUnreadCounts,
    socket,
    unreadConversationIds,
  ]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error("useRealtime must be used inside RealtimeProvider");
  return value;
}
