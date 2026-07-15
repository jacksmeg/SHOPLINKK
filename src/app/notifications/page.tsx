import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotificationList, type NotificationListItem } from "@/components/notifications/notification-list";
import { requireUser } from "@/lib/auth-guards";
import { adminLinks } from "@/lib/admin-navigation";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { sellerLinksForKind } from "@/lib/seller-access";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireUser();
  const [store, notifications] = await Promise.all([
    session.user.role === "SELLER" || session.user.role === "ADMIN"
      ? prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { kind: true } })
      : Promise.resolve(null),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);
  const links =
    session.user.role === "ADMIN"
      ? adminLinks
      : session.user.role === "RIDER"
        ? riderLinks
        : session.user.role === "SELLER"
          ? sellerLinksForKind(store?.kind)
          : buyerLinks;
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
    <DashboardShell
      eyebrow="Account"
      title="Notifications"
      description="Important updates about listings, reports, messages, and account security."
      links={links}
    >
      <NotificationList notifications={notificationItems} />
    </DashboardShell>
  );
}
