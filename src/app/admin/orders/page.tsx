import Link from "next/link";
import { ChefHat, ClipboardList, CreditCard, Truck } from "lucide-react";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireRole(["ADMIN"]);
  const [foodOrders, marketplaceOrders, deliveries, payments] = await Promise.all([
    prisma.foodOrder.findMany({ include: { store: true, buyer: true, items: true }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.marketplaceOrder.findMany({ include: { store: true, buyer: true, seller: true, items: true }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.delivery.count(),
    prisma.paymentTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const total = foodOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) + marketplaceOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  return (
    <DashboardShell eyebrow="Admin" title="Order management" description="View marketplace orders, food orders, delivery orders, billing records, and rider assignments." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Food orders" value={foodOrders.length} icon={ChefHat} helper="Restaurant orders" tone="sea" />
        <StatCard label="Delivery orders" value={deliveries} icon={Truck} helper="Rider delivery records" tone="pink" />
        <StatCard label="Order value" value={formatCurrency(total)} icon={ClipboardList} helper="Food + marketplace total" tone="yellow" />
        <StatCard label="Payments" value={payments.length} icon={CreditCard} helper="Recent payment records" tone="purple" />
      </div>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--ink)]">Recent food orders</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">View, track, and remove food order records.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {foodOrders.map((order) => (
            <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/food-orders/${order.id}`} className="text-xs font-black text-[var(--brand-dark)]">{order.store.name} - {order.buyerName || order.buyer.name || "Buyer"}</Link>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")} - {compactDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-right"><span><Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge><p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p></span><AdminDeleteButton endpoint={`/api/admin/orders/${order.id}?type=food`} confirmText="Delete this food order?" /></div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Recent marketplace orders</h2>
        <div className="mt-4 grid gap-3">
          {marketplaceOrders.map((order) => (
            <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--ink)]">{order.store?.name || order.seller.name || "Seller"} - {order.buyerName || order.buyer.name || "Buyer"}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.title}`).join(", ")} - {compactDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                  <span><Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge><p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p></span>
                  <AdminDeleteButton endpoint={`/api/admin/orders/${order.id}?type=marketplace`} confirmText="Delete this marketplace order?" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
