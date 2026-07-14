import { Clock, Truck } from "lucide-react";
import { DeliveryRequestForm } from "@/components/seller/delivery-request-form";
import { FoodOrderActions } from "@/components/seller/food-order-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerFoodLinks } from "@/lib/seller-food-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColumns = [
  { key: "PENDING_PAYMENT", label: "Pending payment" },
  { key: "PAID", label: "Paid" },
  { key: "PREPARING", label: "Preparing" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

export default async function SellerFoodOrdersPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
    include: {
      foodOrders: {
        include: {
          buyer: { select: { name: true, phone: true } },
          items: true,
          deliveries: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
          deliveryRequests: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (store?.kind !== "FOOD") {
    return (
      <DashboardShell eyebrow="Food seller" title="Food orders" description="Turn on food store mode before receiving food orders." links={sellerFoodLinks}>
        <div className="app-panel p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Food store mode is not active</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Switch your store type to Food seller / restaurant from store settings.</p>
          <ButtonLink href="/seller/store/edit" className="mt-4">Edit store</ButtonLink>
        </div>
      </DashboardShell>
    );
  }

  const orders = store.foodOrders;

  return (
    <DashboardShell
      eyebrow="Food seller"
      title="Food order management"
      description="Track each order from MoMo payment to preparation, dispatch, and delivery."
      links={sellerFoodLinks}
    >
      <div className="mb-5 grid gap-2 sm:grid-cols-5">
        {statusColumns.map((column) => (
          <div key={column.key} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{column.label}</p>
            <p className="mt-1 text-lg font-black text-[var(--brand-dark)]">{orders.filter((order) => order.status === column.key).length}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {orders.map((order) => (
          <article key={order.id} className="app-panel p-4 sm:p-5">
            {(() => {
              const activeDelivery = order.deliveries[0];
              const activeRequest = order.deliveryRequests[0];
              const productName = order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
              return (
                <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{order.buyerPhone || order.buyer.phone || "No phone"} - {order.deliveryAddress}</p>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{compactDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                <div className="mt-1">
                  <Badge tone={order.directPaymentStatus === "CONFIRMED" ? "green" : order.directPaymentStatus === "SUBMITTED" ? "blue" : "neutral"}>
                    {titleCase(order.directPaymentStatus)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
              {order.items.map((item) => {
                const options = Array.isArray(item.options) ? item.options as Array<{ name?: string; quantity?: number; price?: number }> : [];
                return (
                  <li key={item.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-[var(--ink)]">{item.quantity}x {item.name}</span>
                      <span className="font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.lineTotal))}</span>
                    </div>
                    {options.length ? (
                      <p className="mt-1 text-[0.68rem]">
                        Add-ons: {options.map((option) => `${option.quantity ?? 1}x ${option.name}`).join(", ")}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
              {order.estimatedDeliveryMinutes ? <p className="inline-flex items-center gap-2 rounded-[8px] bg-cyan-50 p-3 text-cyan-950"><Clock size={15} /> Estimated delivery: {order.estimatedDeliveryMinutes} mins</p> : null}
              {order.deliveryNote ? <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">{order.deliveryNote}</p> : null}
              {order.paymentReference ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-[var(--brand-dark)]">Payment reference: <strong>{order.paymentReference}</strong></p> : null}
              {order.buyerPaymentNote ? <p className="rounded-[8px] bg-white p-3">Buyer payment note: <strong>{order.buyerPaymentNote}</strong></p> : null}
              {order.paymentProofUrl ? (
                <ButtonLink href={order.paymentProofUrl} target="_blank" rel="noreferrer" variant="secondary">
                  View payment proof
                </ButtonLink>
              ) : null}
            </div>
            <FoodOrderActions orderId={order.id} />
            <DeliveryRequestForm
              foodOrderId={order.id}
              pickupAddress={store.address || store.location}
              deliveryAddress={order.deliveryAddress || ""}
              productName={productName}
              estimatedMinutes={order.estimatedDeliveryMinutes}
              activeDeliveryId={activeDelivery?.id}
              activeRequestStatus={activeRequest?.status}
            />
                </>
              );
            })()}
          </article>
        ))}
        {!orders.length ? <EmptyState title="No food orders yet" description="Orders from buyers will appear here after they add food to cart and checkout." icon={Truck} /> : null}
      </div>
    </DashboardShell>
  );
}
