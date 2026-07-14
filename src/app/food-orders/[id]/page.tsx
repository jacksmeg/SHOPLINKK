import Link from "next/link";
import { notFound } from "next/navigation";
import { ChefHat, Clock3, MapPinned, Phone, ReceiptText, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DirectPaymentProofForm } from "@/components/payments/direct-payment-proof-form";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatGhanaPhone } from "@/lib/ghana";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const foodStatuses = ["PENDING_PAYMENT", "PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const deliveryStatuses = ["WAITING_FOR_RIDER", "ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY", "DELIVERED"];

export default async function FoodOrderTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const order = await prisma.foodOrder.findFirst({
    where: {
      id,
      OR: [
        { buyerId: session.user.id },
        { store: { ownerId: session.user.id } },
        ...(session.user.role === "ADMIN" ? [{}] : []),
      ],
    },
    include: {
      buyer: { select: { name: true, phone: true } },
      store: { select: { name: true, slug: true, phone: true, whatsapp: true, momoNumber: true, address: true, area: true, location: true, ownerId: true } },
      items: true,
      deliveryRequests: { orderBy: { createdAt: "desc" }, take: 1 },
      deliveries: { orderBy: { createdAt: "desc" }, take: 1, include: { rider: { include: { user: { select: { name: true, phone: true, image: true } } } } } },
    },
  });

  if (!order) notFound();

  const delivery = order.deliveries[0];
  const deliveryRequest = order.deliveryRequests[0];
  const sellerPhone = order.store.whatsapp || order.store.phone;
  const buyerPhone = order.buyerPhone || order.buyer.phone;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--brand)]">Food order tracker</p>
          <h1 className="mt-1 text-xl font-black text-[var(--ink)]">{order.store.name}</h1>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Placed {compactDate(order.createdAt)} / {order.deliveryAddress}</p>
        </div>
        <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>
          {titleCase(order.status)}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          <article className="app-panel p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ChefHat className="text-[var(--brand)]" size={18} />
              <h2 className="text-sm font-black text-[var(--ink)]">Food progress</h2>
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-5">
              {foodStatuses.map((status) => {
                const active = foodStatuses.indexOf(order.status) >= foodStatuses.indexOf(status);
                return (
                  <li key={status} className={`rounded-[8px] border p-3 text-xs font-bold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[var(--line)] bg-white text-[var(--muted)]"}`}>
                    {titleCase(status)}
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs leading-5 text-[var(--muted)]">
              {order.status === "PENDING_PAYMENT"
                ? "Send payment to the food seller and wait for payment confirmation."
                : order.status === "PAID"
                  ? "The seller has confirmed payment and can start preparing your food."
                  : order.status === "PREPARING"
                    ? "Your food is being prepared."
                    : order.status === "OUT_FOR_DELIVERY"
                      ? "Your food is ready for delivery or pickup."
                      : order.status === "DELIVERED"
                        ? "Order delivered. You can review the store or rider."
                        : "This order was cancelled."}
            </div>
          </article>

          <article className="app-panel p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Truck className="text-[var(--brand)]" size={18} />
              <h2 className="text-sm font-black text-[var(--ink)]">Delivery tracker</h2>
            </div>
            {delivery ? (
              <>
                <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {deliveryStatuses.map((status) => {
                    const active = deliveryStatuses.indexOf(delivery.status) >= deliveryStatuses.indexOf(status);
                    return (
                      <li key={status} className={`rounded-[8px] border p-2 text-[0.68rem] font-bold ${active ? "border-blue-200 bg-blue-50 text-blue-800" : "border-[var(--line)] bg-white text-[var(--muted)]"}`}>
                        {titleCase(status)}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[var(--brand-soft)] p-3">
                  <div>
                    <p className="text-xs font-black text-[var(--brand-dark)]">Rider: {delivery.rider.user.name || "Assigned rider"}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">ETA: {delivery.estimatedMinutes ? `${delivery.estimatedMinutes} minutes` : "Rider will update location"}</p>
                  </div>
                  <ButtonLink href={`/deliveries/${delivery.id}`}>
                    <MapPinned size={15} />
                    Open live map
                  </ButtonLink>
                </div>
              </>
            ) : deliveryRequest ? (
              <p className="mt-4 rounded-[8px] border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-900">
                Delivery request status: {titleCase(deliveryRequest.status)}. The live map appears after a rider accepts.
              </p>
            ) : (
              <p className="mt-4 rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs leading-5 text-[var(--muted)]">
                Waiting for the seller to request or assign a rider. You can still track the food preparation status here.
              </p>
            )}
          </article>

          <article className="app-panel p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ReceiptText className="text-[var(--brand)]" size={18} />
              <h2 className="text-sm font-black text-[var(--ink)]">Items ordered</h2>
            </div>
            <ul className="mt-4 grid gap-3">
              {order.items.map((item) => {
                const options = Array.isArray(item.options) ? item.options as Array<{ name?: string; quantity?: number; lineTotal?: number; price?: number }> : [];
                return (
                  <li key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[var(--ink)]">{item.quantity}x {item.name}</p>
                        {options.length ? <p className="mt-1 text-[var(--muted)]">Add-ons: {options.map((option) => `${option.name ?? "Add-on"} x ${option.quantity ?? 1}`).join(", ")}</p> : null}
                      </div>
                      <p className="font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.lineTotal))}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        </section>

        <aside className="grid gap-4 self-start lg:sticky lg:top-20">
          <div className="app-panel p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Total</p>
            <p className="mt-2 text-2xl font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]"><Clock3 size={14} /> Estimated delivery: {order.estimatedDeliveryMinutes ? `${order.estimatedDeliveryMinutes} minutes` : "Seller will confirm"}</p>
            <div className="mt-3 rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs leading-5 text-[var(--muted)]">
              <p><strong className="text-[var(--ink)]">Payment status:</strong> {titleCase(order.directPaymentStatus)}</p>
              {order.paymentReference ? <p><strong className="text-[var(--ink)]">Reference:</strong> {order.paymentReference}</p> : null}
              {order.buyerPaymentNote ? <p><strong className="text-[var(--ink)]">Buyer note:</strong> {order.buyerPaymentNote}</p> : null}
              {order.sellerPaymentNote ? <p><strong className="text-[var(--ink)]">Seller note:</strong> {order.sellerPaymentNote}</p> : null}
              {order.paymentProofUrl ? (
                <Link href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex font-black text-[var(--brand-dark)]">
                  View payment proof
                </Link>
              ) : null}
            </div>
          </div>

          <div className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Contact details</h2>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
              <p><strong className="text-[var(--ink)]">Buyer:</strong> {order.buyerName || order.buyer.name || "Buyer"}</p>
              <p><strong className="text-[var(--ink)]">Buyer phone:</strong> {buyerPhone || "Not added"}</p>
              <p><strong className="text-[var(--ink)]">Seller:</strong> <Link href={`/stores/${order.store.slug}`} className="font-bold text-[var(--brand-dark)]">{order.store.name}</Link></p>
              <p><strong className="text-[var(--ink)]">MoMo:</strong> {order.store.momoNumber || sellerPhone || "Seller will confirm"}</p>
              <p><strong className="text-[var(--ink)]">Store area:</strong> {order.store.area ? `${order.store.area}, ` : ""}{order.store.location}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sellerPhone ? <ButtonLink href={`tel:${formatGhanaPhone(sellerPhone)}`} variant="secondary"><Phone size={15} /> Call seller</ButtonLink> : null}
              <ButtonLink href="/buyer/food-orders" variant="ghost">All orders</ButtonLink>
            </div>
          </div>

          {session.user.id === order.buyerId && !["CONFIRMED", "CANCELLED"].includes(order.directPaymentStatus) ? (
            <DirectPaymentProofForm endpoint={`/api/food-orders/${order.id}/payment`} />
          ) : null}
        </aside>
      </div>
    </main>
  );
}
