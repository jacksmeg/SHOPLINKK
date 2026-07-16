import Link from "next/link";
import { ChefHat, ClipboardList, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DirectPaymentProofForm } from "@/components/payments/direct-payment-proof-form";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const session = await requireUser();
  const [foodOrders, marketplaceOrders, deliveries, chats] = await Promise.all([
    prisma.foodOrder.findMany({ where: { buyerId: session.user.id }, include: { store: true, items: true, deliveries: { take: 1, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.marketplaceOrder.findMany({
      where: { buyerId: session.user.id },
      include: { seller: { select: { name: true, phone: true } }, store: { select: { name: true, slug: true, momoNumber: true, phone: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.delivery.findMany({ where: { buyerId: session.user.id }, include: { rider: { include: { user: true } } }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.conversation.count({ where: { buyerId: session.user.id } }),
  ]);
  const pending = foodOrders.filter((order) => ["PENDING_PAYMENT", "PAID"].includes(order.status)).length
    + marketplaceOrders.filter((order) => ["PENDING_PAYMENT", "PAYMENT_SUBMITTED"].includes(order.status)).length;
  const preparing = foodOrders.filter((order) => order.status === "PREPARING").length;
  const onDelivery = deliveries.filter((delivery) => !["DELIVERED", "CANCELLED"].includes(delivery.status)).length;
  const completed = foodOrders.filter((order) => order.status === "DELIVERED").length
    + marketplaceOrders.filter((order) => order.status === "DELIVERED").length;

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
        <h2 className="text-sm font-black text-[var(--ink)]">Marketplace direct MoMo orders</h2>
        <div className="mt-4 grid gap-3">
          {marketplaceOrders.map((order) => {
            const paymentRequested = order.sellerPaymentNote?.startsWith("PAYMENT_REQUESTED");
            return (
              <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--ink)]">{order.store?.name || order.seller.name || "Seller"}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.title}`).join(", ")}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{compactDate(order.createdAt)} - {order.deliveryAddress}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">
                      Payment: {paymentRequested ? "Seller approved, payment details available" : "Waiting for seller approval"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                    <div className="mt-1">
                      <Badge tone={order.directPaymentStatus === "CONFIRMED" ? "green" : order.directPaymentStatus === "SUBMITTED" ? "blue" : "neutral"}>{titleCase(order.directPaymentStatus)}</Badge>
                    </div>
                    <p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                  {order.paymentReference ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-[var(--brand-dark)]">Payment reference: <strong>{order.paymentReference}</strong></p> : null}
                  {order.paymentProofUrl ? (
                    <Link href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 font-black text-[var(--brand-dark)]">
                      View payment proof
                    </Link>
                  ) : null}
                </div>
                {!paymentRequested && !["CONFIRMED", "CANCELLED"].includes(order.directPaymentStatus) ? (
                  <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-xs font-semibold leading-5 text-[var(--muted)]">
                    Your order request has been sent. Please wait for the seller to approve it before making payment.
                  </div>
                ) : null}
                {paymentRequested && !["CONFIRMED", "CANCELLED"].includes(order.directPaymentStatus) ? (
                  <div className="mt-3">
                    <DirectPaymentProofForm
                      endpoint={`/api/marketplace-orders/${order.id}/payment`}
                      title="Send product payment proof"
                      sellerPaymentDetails={{
                        storeName: order.store?.name || order.seller.name,
                        momoNumber: order.store?.momoNumber,
                        phone: order.store?.phone || order.seller.phone,
                        amount: Number(order.totalAmount),
                      }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
          {!marketplaceOrders.length ? <p className="text-xs text-[var(--muted)]">Product and service orders will appear here after cart checkout.</p> : null}
        </div>
      </section>
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
