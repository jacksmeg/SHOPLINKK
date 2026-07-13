import Link from "next/link";
import { ChefHat, ClipboardList, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const session = await requireUser();
  const [foodOrders, deliveries, chats] = await Promise.all([
    prisma.foodOrder.findMany({ where: { buyerId: session.user.id }, include: { store: true, items: true, deliveries: { take: 1, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.delivery.findMany({ where: { buyerId: session.user.id }, include: { rider: { include: { user: true } } }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.conversation.count({ where: { buyerId: session.user.id } }),
  ]);
  const pending = foodOrders.filter((order) => ["PENDING_PAYMENT", "PAID"].includes(order.status)).length;
  const preparing = foodOrders.filter((order) => order.status === "PREPARING").length;
  const onDelivery = deliveries.filter((delivery) => !["DELIVERED", "CANCELLED"].includes(delivery.status)).length;
  const completed = foodOrders.filter((order) => order.status === "DELIVERED").length;

  return (
    <DashboardShell eyebrow="Buyer" title="Orders" description="Track marketplace enquiries, food orders, and deliveries from one place." links={buyerLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending" value={pending} icon={ClipboardList} helper="Awaiting payment or seller action" tone="yellow" />
        <StatCard label="Preparing" value={preparing} icon={ChefHat} helper="Restaurant preparing" tone="pink" />
        <StatCard label="On delivery" value={onDelivery} icon={Truck} helper="Rider assigned" tone="blue" />
        <StatCard label="Completed" value={completed} icon={PackageCheck} helper="Delivered orders" tone="sea" />
        <StatCard label="Product chats" value={chats} icon={MessageCircle} helper="Marketplace enquiries" tone="purple" />
      </div>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Recent food orders</h2>
        <div className="mt-4 grid gap-3">
          {foodOrders.map((order) => (
            <Link key={order.id} href={`/food-orders/${order.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--ink)]">{order.store.name}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{compactDate(order.createdAt)} - {order.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                  <p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
                </div>
              </div>
            </Link>
          ))}
          {!foodOrders.length ? <p className="text-xs text-[var(--muted)]">Food and delivery orders will appear here.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
