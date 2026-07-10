export type ChatUser = { id: string; username: string; displayName: string; avatar: string | null };
export type ChatMessage = { id: string; conversationId: string; content: string; createdAt: string; sender: ChatUser | null; own: boolean; clientNonce: string | null };
export type ChatConversation = { id: string; participant: ChatUser; lastMessage: string; lastMessageAt: string; unreadCount: number; online: boolean };
export type ChatMessageNotification = { message: ChatMessage; href: string };
export type ConversationReadEvent = { conversationId: string };
export type UnreadCounts = { unreadConversationIds: string[]; notificationCount: number };
