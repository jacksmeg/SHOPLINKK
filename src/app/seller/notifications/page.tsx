import { Bell, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotificationList, type NotificationListItem } from "@/components/notifications/notification-list";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";

export const dynamic = "force-dynamic";

export default async function SellerNotificationsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, notifications] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { kind: true } }),
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const unread = notifications.filter((notification) => !notification.readAt).length;
  const notificationItems: NotificationListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }));

  return (
    <DashboardShell eyebrow="Seller" title="Notifications" description="Alerts for orders, messages, approvals, low stock, delivery, reviews, and adverts." links={sellerLinksForKind(store?.kind)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Unread" value={unread} icon={Bell} helper="Needs attention" tone="pink" />
        <StatCard label="Total alerts" value={notifications.length} icon={CheckCircle2} helper="Recent notifications" tone="sea" />
      </div>
      <NotificationList notifications={notificationItems} />
    </DashboardShell>
  );
}
