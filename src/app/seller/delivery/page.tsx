import Link from "next/link";
import { Clock, MapPinned, Navigation, Phone, Route, Truck, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LiveOrdersRefresh } from "@/components/seller/live-orders-refresh";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "DELIVERED" || status === "ACCEPTED") return "green";
  if (status === "CANCELLED" || status === "REJECTED") return "red";
  if (status === "ON_THE_WAY" || status === "ITEM_PICKED_UP") return "blue";
  return "gold";
}

export default async function SellerDeliveryPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, requests, deliveries] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { kind: true, name: true, phone: true, address: true, area: true, location: true } }),
    prisma.deliveryRequest.findMany({
      where: { sellerId: session.user.id },
      include: {
        buyer: { select: { name: true, phone: true } },
        rider: { include: { user: { select: { name: true, phone: true } } } },
        foodOrder: { select: { id: true, status: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.delivery.findMany({
      where: { sellerId: session.user.id },
      include: {
        request: true,
        rider: { include: { user: { select: { name: true, phone: true } } } },
        buyer: { select: { name: true, phone: true } },
        foodOrder: { select: { id: true, status: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const activeDeliveries = deliveries.filter((item) => !["DELIVERED", "CANCELLED"].includes(item.status));
  const delivered = deliveries.filter((item) => item.status === "DELIVERED");
  const openRequests = requests.filter((item) => item.status === "OPEN");
  const deliveryValue = deliveries.reduce((sum, item) => sum + Number(item.deliveryFee), 0);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Delivery board"
      description="Request riders, see accepted deliveries, call buyers or riders, and track where every order is moving."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[var(--ink)]">{store?.name || "Store"} delivery workspace</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{store?.address || store?.area || store?.location || "Dunkwa-on-Offin"}</p>
        </div>
        <LiveOrdersRefresh seconds={12} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open requests" value={openRequests.length} icon={Truck} helper="Waiting for rider" tone="sea" />
        <StatCard label="Active deliveries" value={activeDeliveries.length} icon={Navigation} helper="Accepted or moving" tone="pink" />
        <StatCard label="Delivered" value={delivered.length} icon={MapPinned} helper="Completed handoffs" tone="yellow" />
        <StatCard label="Delivery fees" value={formatCurrency(deliveryValue)} icon={Route} helper="Recorded rider fees" tone="blue" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Rider requests</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Every delivery request created from an order appears here.</p>
            </div>
            <ButtonLink href="/seller/orders" variant="secondary">Back to orders</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-[var(--ink)]">{request.productName}</h3>
                      <Badge tone={tone(request.status)}>{titleCase(request.status)}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{request.pickupAddress} to {request.deliveryAddress}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[0.68rem] font-bold text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Route size={12} /> {request.distanceKm ?? "?"} km</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Clock size={12} /> {request.estimatedMinutes ?? "?"} mins</span>
                      <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[var(--brand-dark)]">{formatCurrency(Number(request.deliveryFee))}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>{compactDate(request.createdAt)}</p>
                    <p className="mt-1 font-black text-[var(--ink)]">{request.buyer.name || request.buyer.phone || "Buyer"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {request.buyer.phone ? <ButtonLink href={`tel:${request.buyer.phone}`} variant="secondary" className="min-h-9 px-3 text-xs"><Phone size={14} /> Buyer</ButtonLink> : null}
                  {request.rider?.user.phone ? <ButtonLink href={`tel:${request.rider.user.phone}`} variant="secondary" className="min-h-9 px-3 text-xs"><Phone size={14} /> Rider</ButtonLink> : null}
                  {request.foodOrderId ? <ButtonLink href={`/food-orders/${request.foodOrderId}`} variant="secondary" className="min-h-9 px-3 text-xs">Track order</ButtonLink> : null}
                </div>
              </article>
            ))}
            {!requests.length ? <p className="text-xs text-[var(--muted)]">Delivery requests will appear after you request a rider from an order.</p> : null}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Live delivery status</h2>
          <div className="mt-4 grid gap-3">
            {deliveries.map((delivery) => (
              <article key={delivery.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-[var(--ink)]">{delivery.request.productName}</h3>
                      <Badge tone={tone(delivery.status)}>{titleCase(delivery.status)}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{delivery.request.pickupAddress} to {delivery.request.deliveryAddress}</p>
                    <div className="mt-2 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                      <p className="rounded-[8px] bg-[var(--surface-muted)] p-3"><UserRound size={14} className="mb-1" /> Rider: <strong>{delivery.rider.user.name || delivery.rider.user.phone || "Assigned rider"}</strong></p>
                      <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Buyer: <strong>{delivery.buyer.name || delivery.buyer.phone || "Buyer"}</strong></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(delivery.deliveryFee))}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{delivery.distanceKm ?? "?"} km</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {delivery.rider.user.phone ? <ButtonLink href={`tel:${delivery.rider.user.phone}`} variant="secondary" className="min-h-9 px-3 text-xs"><Phone size={14} /> Call rider</ButtonLink> : null}
                  {delivery.buyer.phone ? <ButtonLink href={`tel:${delivery.buyer.phone}`} variant="secondary" className="min-h-9 px-3 text-xs"><Phone size={14} /> Call buyer</ButtonLink> : null}
                  {delivery.foodOrderId ? <ButtonLink href={`/food-orders/${delivery.foodOrderId}`} variant="secondary" className="min-h-9 px-3 text-xs">Open tracker</ButtonLink> : <Link href="/seller/delivery" className="text-xs font-black text-[var(--brand-dark)]">General delivery</Link>}
                </div>
              </article>
            ))}
            {!deliveries.length ? <p className="text-xs text-[var(--muted)]">Accepted rider deliveries will show here.</p> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
