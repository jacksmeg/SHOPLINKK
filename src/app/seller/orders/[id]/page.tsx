import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Phone, ReceiptText } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MarketplaceOrderActions } from "@/components/seller/marketplace-order-actions";
import { OrderReceiptButton, type ReceiptOrder } from "@/components/seller/order-receipt-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "red";
  if (status === "PAYMENT_SUBMITTED" || status === "READY") return "blue";
  return "gold";
}

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const { id } = await params;
  const order = await prisma.marketplaceOrder.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    include: {
      buyer: { select: { name: true, phone: true, email: true } },
      seller: { select: { name: true, phone: true } },
      store: { select: { kind: true, name: true, slug: true, logoUrl: true, momoNumber: true, phone: true, whatsapp: true, address: true, location: true, area: true, announcementBanner: true } },
      items: true,
    },
  });

  if (!order) notFound();

  const receipt: ReceiptOrder = {
    id: order.id,
    kind: "marketplace",
    storeName: order.store?.name || order.seller.name || "ShopLinkk store",
    storeLogoUrl: order.store?.logoUrl,
    storePhone: order.store?.phone || order.store?.whatsapp || order.seller.phone,
    storeAddress: order.store?.address || order.store?.area || order.store?.location,
    buyerName: order.buyerName || order.buyer.name,
    buyerPhone: order.buyerPhone || order.buyer.phone,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
    status: titleCase(order.status),
    paymentStatus: titleCase(order.directPaymentStatus),
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    note: order.store?.announcementBanner,
  };
  const paymentRequested = order.sellerPaymentNote?.startsWith("PAYMENT_REQUESTED");
  const buyerPhone = order.buyerPhone || order.buyer.phone;

  return (
    <DashboardShell
      eyebrow="Seller order"
      title={`Order #${order.id.slice(0, 8)}`}
      description="Review buyer details, payment state, items, receipt, and seller actions."
      links={sellerLinksForKind(order.store?.kind)}
    >
      <div className="mb-4">
        <ButtonLink href="/seller/orders" variant="secondary">
          <ArrowLeft size={15} />
          Back to orders
        </ButtonLink>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">{order.store?.name || order.seller.name || "Seller order"}</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(order.createdAt)} - {order.items.length} item line{order.items.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={tone(order.status)}>{titleCase(order.status)}</Badge>
              <Badge tone={order.directPaymentStatus === "CONFIRMED" ? "green" : order.directPaymentStatus === "SUBMITTED" ? "blue" : "neutral"}>{titleCase(order.directPaymentStatus)}</Badge>
              <Badge tone={paymentRequested ? "blue" : "gold"}>{paymentRequested ? "Payment requested" : "Seller review"}</Badge>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[8px] border border-[var(--line)]">
            <table className="data-table w-full min-w-[680px] text-left text-xs">
              <thead className="bg-[var(--brand-dark)] text-white">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-white">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-black text-[var(--ink)]">{item.title}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{item.quantity}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="px-4 py-3 font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Buyer</p>
              <p className="mt-2 text-sm font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{buyerPhone || order.buyer.email || "No contact saved"}</p>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Delivery</p>
              <p className="mt-2 flex gap-2 text-xs leading-5 text-[var(--ink)]"><MapPin size={15} /> {order.deliveryAddress || "Address pending"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{order.deliveryNote || "No note"}</p>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Seller payment destination</p>
              <p className="mt-2 text-sm font-black text-[var(--ink)]">{order.store?.momoNumber || order.store?.phone || order.seller.phone || "Set store MoMo"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Buyers see this locked after you request payment.</p>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Payment proof</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Reference: <strong className="text-[var(--ink)]">{order.paymentReference || "Not submitted"}</strong></p>
              {order.paymentProofUrl ? <ButtonLink href={order.paymentProofUrl} target="_blank" rel="noreferrer" variant="secondary" className="mt-2">View proof</ButtonLink> : null}
            </div>
          </div>

          <MarketplaceOrderActions orderId={order.id} status={order.status} paymentRequested={paymentRequested} />
        </section>

        <aside className="grid gap-4 self-start">
          <section className="app-panel p-4">
            <ReceiptText className="text-[var(--brand)]" size={20} />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">Order total</h2>
            <p className="mt-2 text-2xl font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
            <OrderReceiptButton order={receipt} />
          </section>

          <section className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">Customer follow-up</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Use this customer contact after a successful order to invite them back to your store.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {buyerPhone ? (
                <ButtonLink href={`tel:${buyerPhone}`} variant="secondary" className="min-h-9 px-3 text-xs">
                  <Phone size={14} />
                  Call
                </ButtonLink>
              ) : null}
              <ButtonLink href="/chat" variant="secondary" className="min-h-9 px-3 text-xs">
                <MessageCircle size={14} />
                Chat again
              </ButtonLink>
              <ButtonLink href="/seller/delivery" variant="secondary" className="min-h-9 px-3 text-xs">
                Track delivery
              </ButtonLink>
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
