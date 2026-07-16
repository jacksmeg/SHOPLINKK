import { MapPinned, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RiderRequestActions } from "@/components/rider/rider-request-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { compactDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiderRequestsPage() {
  const session = await requireRole(["RIDER", "ADMIN"]);
  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const requests = profile
    ? await prisma.deliveryRequest.findMany({
        where: { status: "OPEN", OR: [{ riderId: null }, { riderId: profile.id }] },
        include: { store: { select: { name: true } }, buyer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <DashboardShell eyebrow="Rider" title="Delivery requests" description="Accept available deliveries from sellers near you." links={riderLinks}>
      <div className="grid gap-3">
        {requests.map((request) => (
          <article key={request.id} className="app-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="blue">Open</Badge>
                <h2 className="mt-2 text-sm font-black text-[var(--ink)]">{request.productName}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{request.store?.name || "Seller"} - {compactDate(request.createdAt)}</p>
              </div>
              <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(request.deliveryFee))}</p>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
              <p className="rounded-[8px] bg-[var(--surface-muted)] p-3"><MapPinned size={14} className="mb-1 text-[var(--brand)]" /> Pickup: {request.pickupAddress}</p>
              <p className="rounded-[8px] bg-[var(--surface-muted)] p-3"><Truck size={14} className="mb-1 text-[var(--brand)]" /> Drop-off: {request.deliveryAddress}</p>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              {request.distanceKm ? `${request.distanceKm.toFixed(1)} km` : "Distance not set"}
              {request.estimatedMinutes ? ` - about ${request.estimatedMinutes} minutes` : ""}
            </p>
            <RiderRequestActions requestId={request.id} />
          </article>
        ))}
        {!requests.length ? <EmptyState title="No open requests" description="New delivery requests from sellers will appear here." icon={Truck} /> : null}
      </div>
    </DashboardShell>
  );
}
