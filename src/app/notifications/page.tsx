import Link from "next/link";
import { Bell, Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <DashboardShell
      eyebrow="Account"
      title="Notifications"
      description="Important updates about listings, reports, messages, and account security."
      links={[
        { href: "/buyer", label: "Buyer overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-3">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.href ?? "/notifications"}
            className="app-panel app-panel-interactive p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={notification.readAt ? "neutral" : "green"}>{titleCase(notification.type)}</Badge>
              <span className="text-xs text-[var(--muted)]">{compactDate(notification.createdAt)}</span>
            </div>
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{notification.title}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{notification.body}</p>
          </Link>
        ))}
        {!notifications.length ? (
          <div className="rounded-[8px] border border-[var(--line)] bg-white p-8 text-center text-xs text-[var(--muted)]">
            No notifications yet.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
