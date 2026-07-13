import Link from "next/link";
import { ChefHat, MapPinned, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerFoodOrdersPage() {
  const session = await requireUser();
  const statuses = ["PENDING_PAYMENT", "PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
  const orders = await prisma.foodOrder.findMany({
    where: { buyerId: session.user.id },
    include: {
      store: { select: { name: true, slug: true, momoNumber: true, phone: true } },
      items: true,
      deliveries: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      deliveryRequests: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Food orders"
      description="Track food orders, MoMo confirmation, preparation, and delivery."
      links={buyerLinks}
    >
      <div className="grid gap-3">
        {orders.map((order) => (
          <article key={order.id} className="app-panel p-4 sm:p-5">
            {(() => {
              const activeDelivery = order.deliveries[0];
              const activeRequest = order.deliveryRequests[0];
              return (
                <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/stores/${order.store.slug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">
                  {order.store.name}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(order.createdAt)} - {order.deliveryAddress}</p>
              </div>
              <div className="text-right">
                <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                <p className="mt-2 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
              </div>
            </div>
            <ol className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-4">
              {statuses.map((status) => {
                const active = statuses.indexOf(order.status) >= statuses.indexOf(status);
                return (
                  <li key={status} className={`rounded-[8px] border p-2 ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[var(--line)] bg-white"}`}>
                    {titleCase(status)}
                  </li>
                );
              })}
            </ol>
            <ul className="mt-4 grid gap-1 text-xs text-[var(--muted)]">
              {order.items.map((item) => {
                const options = Array.isArray(item.options) ? item.options as Array<{ name?: string; quantity?: number; price?: number; lineTotal?: number }> : [];
                return (
                  <li key={item.id}>
                    <span className="font-bold text-[var(--ink)]">{item.quantity}x {item.name}</span> - {formatCurrency(Number(item.lineTotal))}
                    {options.length ? (
                      <span className="mt-1 block text-[0.68rem]">
                        Add-ons: {options.map((option) => `${option.name ?? "Add-on"} x ${option.quantity ?? 1}`).join(", ")}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {order.estimatedDeliveryMinutes ? (
              <p className="mt-3 text-xs font-bold text-[var(--brand-dark)]">Estimated delivery: {order.estimatedDeliveryMinutes} minutes</p>
            ) : null}
            <p className="mt-3 flex items-center gap-2 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs leading-5 text-[var(--brand-dark)]">
              <Truck size={15} />
              Send MoMo to {order.store.momoNumber || order.store.phone || "the seller number"}, then wait for seller confirmation.
            </p>
            {activeDelivery ? (
              <Link href={`/deliveries/${activeDelivery.id}`} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-[8px] bg-[var(--brand)] px-3 text-xs font-black text-white">
                <MapPinned size={14} />
                Track live delivery
              </Link>
            ) : activeRequest ? (
              <p className="mt-3 rounded-[8px] bg-blue-50 p-3 text-xs font-bold text-blue-900">Delivery request: {titleCase(activeRequest.status)}</p>
            ) : null}
            <Link href={`/food-orders/${order.id}`} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--brand-dark)] hover:border-[var(--brand)]">
              <MapPinned size={14} />
              Open order tracker
            </Link>
                </>
              );
            })()}
          </article>
        ))}
        {!orders.length ? <EmptyState title="No food orders yet" description="Food orders you place from food sellers will appear here." icon={ChefHat} /> : null}
      </div>
    </DashboardShell>
  );
}
