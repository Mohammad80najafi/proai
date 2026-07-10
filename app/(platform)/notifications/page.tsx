import { CheckCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationItem, type NotificationType } from "@/components/ui/notification-item";
import { markAllNotificationsReadAction } from "@/features/social/actions";
import { getNotifications } from "@/features/social/data";
import { requireUser } from "@/lib/auth/dal";
import { formatRelativeDate } from "@/lib/format";

export const metadata = { title: "اعلان‌ها" };
function itemType(type: string): NotificationType { if (type === "improvement") return "proposal"; if (type === "achievement") return "accepted"; return type as NotificationType; }

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id).catch(() => []);
  return <div className="space-y-7"><PageHeader eyebrow="مرکز فعالیت" title="اعلان‌ها" description="دنبال‌کردن‌ها، دیدگاه‌ها، پیام‌ها و تصمیم‌های مربوط به پیشنهادهای شما." actions={<form action={markAllNotificationsReadAction}><Button type="submit" variant="outline" size="sm"><CheckCheck className="size-4" />خواندن همه</Button></form>} /><Card className="divide-y divide-white/[0.055] p-2">{notifications.map((item) => <NotificationItem key={item.id} type={itemType(item.type)} title={item.title} description={item.description} timestamp={formatRelativeDate(item.createdAt)} href={item.href} unread={!item.read} actor={item.actor ? { name: item.actor.displayName, avatar: item.actor.avatar } : undefined} />)}{!notifications.length ? <div className="p-12 text-center text-sm text-faint">اعلان تازه‌ای ندارید.</div> : null}</Card></div>;
}
