import Link from "next/link";
import { Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RiderDeliveryStatusActions } from "@/components/rider/rider-delivery-status-actions";
import { RiderLocationTracker } from "@/components/rider/rider-location-tracker";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiderDeliveriesPage() {
  const session = await requireRole(["RIDER", "ADMIN"]);
  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });
  const deliveries = profile
    ? await prisma.delivery.findMany({
        where: { riderId: profile.id, status: { in: ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"] } },
        include: { request: true, buyer: { select: { name: true, phone: true } }, seller: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <DashboardShell eyebrow="Rider" title="Current deliveries" description="Manage live deliveries, GPS sharing, buyer contact, and seller contact." links={riderLinks}>
      <div className="grid gap-4">
        {deliveries.map((delivery) => (
          <article key={delivery.id} className="app-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="blue">{titleCase(delivery.status)}</Badge>
                <h2 className="mt-2 text-sm font-black text-[var(--ink)]">{delivery.request.productName}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(delivery.createdAt)} - {formatCurrency(Number(delivery.deliveryFee))}</p>
              </div>
              <Link href={`/deliveries/${delivery.id}`} className="text-xs font-black text-[var(--brand-dark)]">Open live tracker</Link>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
              <a href={`tel:${delivery.request.pickupPhone || delivery.seller.phone || ""}`} className="rounded-[8px] bg-[var(--surface-muted)] p-3">Seller: {delivery.request.pickupPhone || delivery.seller.phone || "No phone"}</a>
              <a href={`tel:${delivery.request.deliveryPhone || delivery.buyer.phone || ""}`} className="rounded-[8px] bg-[var(--surface-muted)] p-3">Buyer: {delivery.request.deliveryPhone || delivery.buyer.phone || "No phone"}</a>
            </div>
            <div className="mt-3"><RiderLocationTracker deliveryId={delivery.id} /></div>
            <RiderDeliveryStatusActions deliveryId={delivery.id} />
          </article>
        ))}
        {!deliveries.length ? <EmptyState title="No current delivery" description="Accepted deliveries will appear here until completed." icon={Truck} /> : null}
      </div>
    </DashboardShell>
  );
}
