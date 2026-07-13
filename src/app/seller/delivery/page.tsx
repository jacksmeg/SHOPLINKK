import Link from "next/link";
import { MapPinned, Phone, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerDeliveryPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [requests, deliveries] = await Promise.all([
    prisma.deliveryRequest.findMany({ where: { sellerId: session.user.id }, include: { buyer: { select: { name: true, phone: true } }, rider: { include: { user: { select: { name: true, phone: true } } } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.delivery.findMany({ where: { sellerId: session.user.id }, include: { rider: { include: { user: { select: { name: true, phone: true } } } }, buyer: { select: { name: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <DashboardShell eyebrow="Seller" title="Delivery management" description="Request riders, track delivery state, and contact buyers or assigned riders." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Delivery requests" value={requests.length} icon={Truck} helper="All rider requests" tone="sea" />
        <StatCard label="Active deliveries" value={deliveries.filter((item) => !["DELIVERED", "CANCELLED"].includes(item.status)).length} icon={MapPinned} helper="Currently moving" tone="pink" />
        <StatCard label="Delivered" value={deliveries.filter((item) => item.status === "DELIVERED").length} icon={Phone} helper="Completed deliveries" tone="yellow" />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Requests</h2>
          <div className="mt-4 grid gap-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--ink)]">{request.productName}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{request.pickupAddress} to {request.deliveryAddress}</p>
                  </div>
                  <Badge tone={request.status === "ACCEPTED" ? "green" : request.status === "REJECTED" ? "red" : "gold"}>{titleCase(request.status)}</Badge>
                </div>
                <p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(request.deliveryFee))} - {request.distanceKm ?? "?"} km</p>
              </div>
            ))}
            {!requests.length ? <p className="text-xs text-[var(--muted)]">Delivery requests will appear after you request a rider from an order.</p> : null}
          </div>
        </section>
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Live delivery status</h2>
          <div className="mt-4 grid gap-3">
            {deliveries.map((delivery) => (
              <Link key={delivery.id} href={delivery.foodOrderId ? `/food-orders/${delivery.foodOrderId}` : "/seller/delivery"} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[var(--ink)]">Rider: {delivery.rider.user.name || delivery.rider.user.phone || "Assigned rider"}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">Buyer: {delivery.buyer.name || delivery.buyer.phone || "Buyer"} - {compactDate(delivery.createdAt)}</p>
                  </div>
                  <Badge tone={delivery.status === "DELIVERED" ? "green" : delivery.status === "CANCELLED" ? "red" : "gold"}>{titleCase(delivery.status)}</Badge>
                </div>
              </Link>
            ))}
            {!deliveries.length ? <p className="text-xs text-[var(--muted)]">Accepted rider deliveries will show here.</p> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
