import Link from "next/link";
import { ChefHat, ClipboardList, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [foodOrders, conversations, deliveries] = await Promise.all([
    prisma.foodOrder.findMany({
      where: { store: { ownerId: session.user.id } },
      include: { buyer: { select: { name: true, phone: true } }, items: true, deliveries: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.conversation.findMany({
      where: { sellerId: session.user.id },
      include: { product: { select: { title: true, slug: true } }, buyer: { select: { name: true, phone: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.delivery.count({ where: { sellerId: session.user.id, status: { in: ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"] } } }),
  ]);

  const pending = foodOrders.filter((order) => ["PENDING_PAYMENT", "PAID"].includes(order.status)).length;
  const preparing = foodOrders.filter((order) => order.status === "PREPARING").length;
  const delivered = foodOrders.filter((order) => order.status === "DELIVERED").length;
  const revenue = foodOrders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <DashboardShell eyebrow="Seller" title="Order management" description="Manage product enquiries, food orders, delivery requests, and buyer conversations." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending" value={pending} icon={ClipboardList} helper="New paid or unpaid orders" tone="yellow" />
        <StatCard label="Preparing" value={preparing} icon={ChefHat} helper="Food in progress" tone="pink" />
        <StatCard label="On delivery" value={deliveries} icon={Truck} helper="Rider active" tone="blue" />
        <StatCard label="Delivered" value={delivered} icon={PackageCheck} helper="Completed food orders" tone="sea" />
        <StatCard label="Order value" value={formatCurrency(revenue)} icon={ClipboardList} helper="Non-cancelled total" tone="purple" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Food orders</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Accept, prepare, assign rider, and track delivery.</p>
            </div>
            <ButtonLink href="/seller/food/orders" variant="secondary">Open food orders</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3">
            {foodOrders.slice(0, 10).map((order) => (
              <Link key={order.id} href={`/food-orders/${order.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{compactDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                    <p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>
              </Link>
            ))}
            {!foodOrders.length ? <p className="text-xs text-[var(--muted)]">No food orders yet.</p> : null}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-[var(--brand)]" />
            <h2 className="text-sm font-black text-[var(--ink)]">Marketplace enquiries</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {conversations.slice(0, 8).map((conversation) => (
              <Link key={conversation.id} href={`/chat/${conversation.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                <p className="text-xs font-black text-[var(--ink)]">{conversation.product.title}</p>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{conversation.buyer.name || conversation.buyer.phone || "Buyer"} - {conversation.messages[0]?.body || "Open chat"}</p>
              </Link>
            ))}
            {!conversations.length ? <p className="text-xs text-[var(--muted)]">Product chats will appear here.</p> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
