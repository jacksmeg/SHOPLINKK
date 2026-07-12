import Link from "next/link";
import { Bike, Clock, History, Star, Truck, WalletCards } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RiderAvailabilityControl } from "@/components/rider/rider-availability-control";
import { RiderDeliveryStatusActions } from "@/components/rider/rider-delivery-status-actions";
import { RiderLocationTracker } from "@/components/rider/rider-location-tracker";
import { RiderRequestActions } from "@/components/rider/rider-request-actions";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { riderLinks } from "@/lib/rider-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sumFees(deliveries: { deliveryFee: unknown }[]) {
  return deliveries.reduce((sum, item) => sum + Number(item.deliveryFee || 0), 0);
}

export default async function RiderDashboardPage() {
  const session = await requireRole(["RIDER", "ADMIN"]);
  const profile = await prisma.riderProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true } },
      ratings: { select: { rating: true } },
      deliveries: {
        include: {
          request: true,
          buyer: { select: { name: true, phone: true } },
          seller: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!profile) {
    return (
      <DashboardShell eyebrow="Rider" title="Rider dashboard" description="Submit your rider documents before going online." links={riderLinks}>
        <div className="app-panel p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Complete rider profile</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Add your Ghana Card, license, vehicle documents, emergency contact, and payout details.</p>
          <ButtonLink href="/rider/profile" className="mt-4">Open rider application</ButtonLink>
        </div>
      </DashboardShell>
    );
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completed = profile.deliveries.filter((delivery) => delivery.status === "DELIVERED");
  const ratingAverage = profile.ratings.length
    ? profile.ratings.reduce((sum, item) => sum + item.rating, 0) / profile.ratings.length
    : 0;
  const activeDelivery = profile.deliveries.find((delivery) => ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"].includes(delivery.status));
  const openRequests = await prisma.deliveryRequest.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { store: { select: { name: true } }, buyer: { select: { name: true, phone: true } } },
  });

  const stats = [
    { label: "Today", value: formatCurrency(sumFees(completed.filter((delivery) => delivery.deliveredAt && delivery.deliveredAt >= startOfDay))), icon: WalletCards, color: "bg-cyan-600" },
    { label: "This week", value: formatCurrency(sumFees(completed.filter((delivery) => delivery.deliveredAt && delivery.deliveredAt >= startOfWeek))), icon: History, color: "bg-pink-600" },
    { label: "This month", value: formatCurrency(sumFees(completed.filter((delivery) => delivery.deliveredAt && delivery.deliveredAt >= startOfMonth))), icon: Truck, color: "bg-amber-400 text-slate-950" },
    { label: "Total earnings", value: formatCurrency(sumFees(completed)), icon: Bike, color: "bg-blue-700" },
    { label: "Ratings", value: ratingAverage ? `${ratingAverage.toFixed(1)} / 5` : "New", icon: Star, color: "bg-purple-700" },
    { label: "Completed", value: String(completed.length), icon: Clock, color: "bg-red-600" },
  ];

  return (
    <DashboardShell
      eyebrow="Rider"
      title={`Good day, ${profile.user.name?.split(" ")[0] || "Rider"}`}
      description="Go online, accept requests, share live GPS, update delivery status, and track earnings."
      links={riderLinks}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--line)] bg-white p-4">
        <div>
          <Badge tone={profile.status === "APPROVED" ? "green" : profile.status === "SUSPENDED" ? "red" : "gold"}>{titleCase(profile.status)}</Badge>
          <p className="mt-2 text-xs text-[var(--muted)]">{profile.status === "APPROVED" ? "You can receive delivery requests." : "Admin must approve your rider application before deliveries."}</p>
        </div>
        <ButtonLink href="/rider/profile" variant="secondary">Update profile</ButtonLink>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className={`${item.color} rounded-[10px] p-4 text-white shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold opacity-90">{item.label}</p>
                <p className="mt-2 text-lg font-black">{item.value}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-[10px] bg-white/20"><item.icon size={19} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-5">
          <RiderAvailabilityControl current={profile.availability} disabled={profile.status !== "APPROVED"} />
          {activeDelivery ? <RiderLocationTracker deliveryId={activeDelivery.id} /> : null}
        </div>

        <section className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Active delivery</h2>
          {activeDelivery ? (
            <article className="mt-4 rounded-[10px] border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="blue">{titleCase(activeDelivery.status)}</Badge>
                  <h3 className="mt-2 text-sm font-black text-[var(--ink)]">{activeDelivery.request.productName}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{activeDelivery.request.pickupAddress} to {activeDelivery.request.deliveryAddress}</p>
                </div>
                <Link href={`/deliveries/${activeDelivery.id}`} className="text-xs font-black text-[var(--brand-dark)]">Open tracker</Link>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
                <a href={`tel:${activeDelivery.request.pickupPhone || activeDelivery.seller.phone || ""}`} className="rounded-[8px] bg-[var(--surface-muted)] p-3">Call seller: {activeDelivery.request.pickupPhone || activeDelivery.seller.phone || "No phone"}</a>
                <a href={`tel:${activeDelivery.request.deliveryPhone || activeDelivery.buyer.phone || ""}`} className="rounded-[8px] bg-[var(--surface-muted)] p-3">Call buyer: {activeDelivery.request.deliveryPhone || activeDelivery.buyer.phone || "No phone"}</a>
              </div>
              <RiderDeliveryStatusActions deliveryId={activeDelivery.id} />
            </article>
          ) : (
            <EmptyState title="No active delivery" description="Accept an open request when you are ready to deliver." icon={Truck} />
          )}
        </section>
      </div>

      <section className="mt-5 app-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-[var(--ink)]">New delivery requests</h2>
          <ButtonLink href="/rider/requests" variant="secondary">View all</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3">
          {openRequests.map((request) => (
            <article key={request.id} className="rounded-[10px] border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--ink)]">{request.productName}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{request.store?.name || "Seller"} - {compactDate(request.createdAt)}</p>
                </div>
                <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(request.deliveryFee))}</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{request.pickupAddress} to {request.deliveryAddress}</p>
              <RiderRequestActions requestId={request.id} />
            </article>
          ))}
          {!openRequests.length ? <EmptyState title="No delivery requests now" description="When sellers request riders, they will appear here." icon={Truck} /> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
