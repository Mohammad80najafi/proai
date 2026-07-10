import { getUnreadConversationIds } from "@/features/chat/data";
import { getUnreadNotificationCount } from "@/features/social/data";
import { getOptionalUser } from "@/lib/auth/dal";

export async function GET() {
  const user = await getOptionalUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [unreadConversationIds, notificationCount] = await Promise.all([
    getUnreadConversationIds(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return Response.json({ unreadConversationIds, notificationCount });
}
