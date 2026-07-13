import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerNotificationsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = notifications.filter((notification) => !notification.readAt).length;

  return (
    <DashboardShell eyebrow="Seller" title="Notifications" description="Alerts for orders, messages, approvals, low stock, delivery, reviews, and adverts." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Unread" value={unread} icon={Bell} helper="Needs attention" tone="pink" />
        <StatCard label="Total alerts" value={notifications.length} icon={CheckCircle2} helper="Recent notifications" tone="sea" />
      </div>
      <div className="mt-5 grid gap-3">
        {notifications.map((notification) => {
          const content = (
            <article className="app-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--ink)]">{notification.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{notification.body}</p>
                  <p className="mt-2 text-[0.68rem] text-[var(--muted)]">{compactDate(notification.createdAt)}</p>
                </div>
                <Badge tone={notification.readAt ? "neutral" : "gold"}>{titleCase(notification.type)}</Badge>
              </div>
            </article>
          );
          return notification.href ? <Link key={notification.id} href={notification.href}>{content}</Link> : <div key={notification.id}>{content}</div>;
        })}
        {!notifications.length ? <p className="text-xs text-[var(--muted)]">No notifications yet.</p> : null}
      </div>
    </DashboardShell>
  );
}
