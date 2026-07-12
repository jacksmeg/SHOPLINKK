import Link from "next/link";
import { History } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiderHistoryPage() {
  const session = await requireRole(["RIDER", "ADMIN"]);
  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });
  const deliveries = profile
    ? await prisma.delivery.findMany({
        where: { riderId: profile.id },
        include: { request: true, buyer: { select: { name: true } }, seller: { select: { name: true } }, ratings: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <DashboardShell eyebrow="Rider" title="Delivery history" description="View completed, cancelled, and active delivery records." links={riderLinks}>
      <div className="grid gap-3">
        {deliveries.map((delivery) => (
          <Link key={delivery.id} href={`/deliveries/${delivery.id}`} className="app-panel block p-4 transition hover:border-[var(--brand)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone={delivery.status === "DELIVERED" ? "green" : delivery.status === "CANCELLED" ? "red" : "blue"}>{titleCase(delivery.status)}</Badge>
                <h2 className="mt-2 text-sm font-black text-[var(--ink)]">{delivery.request.productName}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{delivery.seller.name || "Seller"} to {delivery.buyer.name || "Buyer"} - {compactDate(delivery.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(delivery.deliveryFee))}</p>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{delivery.distanceKm ? `${delivery.distanceKm.toFixed(1)} km` : "No distance"}</p>
              </div>
            </div>
          </Link>
        ))}
        {!deliveries.length ? <EmptyState title="No delivery history yet" description="Your completed delivery work will appear here." icon={History} /> : null}
      </div>
    </DashboardShell>
  );
}
