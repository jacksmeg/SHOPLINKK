import Link from "next/link";
import { Flag, MapPinned, Truck } from "lucide-react";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminDeliveryAssignForm } from "@/components/delivery/admin-delivery-assign-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { adminLinks } from "@/lib/admin-navigation";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  await requireRole(["ADMIN"]);
  const [requests, deliveries, reports, riders] = await Promise.all([
    prisma.deliveryRequest.findMany({
      include: { store: { select: { name: true } }, buyer: { select: { name: true, phone: true } }, seller: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.delivery.findMany({
      include: { request: true, rider: { include: { user: { select: { name: true, phone: true } } } }, buyer: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.deliveryReport.findMany({
      where: { status: "OPEN" },
      include: { delivery: { include: { request: true } }, reporter: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.riderProfile.findMany({
      where: { status: "APPROVED" },
      include: { user: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);
  const riderOptions = riders.map((rider) => ({ id: rider.id, name: rider.user.name }));
  const openRequests = requests.filter((request) => request.status === "OPEN");
  const activeDeliveries = deliveries.filter((delivery) => ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"].includes(delivery.status));

  return (
    <DashboardShell eyebrow="Admin" title="Delivery management" description="Monitor delivery requests, assign riders manually, review reports, and inspect live delivery state." links={adminLinks}>
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-[10px] bg-cyan-600 p-4 text-white"><p className="text-xs font-bold">Open requests</p><p className="mt-2 text-xl font-black">{openRequests.length}</p></div>
        <div className="rounded-[10px] bg-pink-600 p-4 text-white"><p className="text-xs font-bold">Active deliveries</p><p className="mt-2 text-xl font-black">{activeDeliveries.length}</p></div>
        <div className="rounded-[10px] bg-amber-400 p-4 text-slate-950"><p className="text-xs font-bold">Reports</p><p className="mt-2 text-xl font-black">{reports.length}</p></div>
        <div className="rounded-[10px] bg-blue-700 p-4 text-white"><p className="text-xs font-bold">Approved riders</p><p className="mt-2 text-xl font-black">{riders.length}</p></div>
      </div>

      <section className="app-panel p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Open rider requests</h2>
        <div className="mt-4 grid gap-3">
          {openRequests.map((request) => (
            <article key={request.id} className="rounded-[10px] border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="gold">{titleCase(request.status)}</Badge>
                  <h3 className="mt-2 text-sm font-black text-[var(--ink)]">{request.productName}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">{request.store?.name || request.seller.name || "Seller"} - {compactDate(request.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                  <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(request.deliveryFee))}</p>
                  <AdminDeleteButton endpoint={`/api/admin/deliveries/${request.id}?type=request`} label="Delete request" confirmText="Delete this delivery request?" />
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">{request.pickupAddress} to {request.deliveryAddress}</p>
              <AdminDeliveryAssignForm requestId={request.id} riders={riderOptions} />
            </article>
          ))}
          {!openRequests.length ? <EmptyState title="No open requests" description="Seller delivery requests will appear here." icon={Truck} /> : null}
        </div>
      </section>

      <section className="mt-5 app-panel p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Live and recent deliveries</h2>
        <div className="mt-4 grid gap-3">
          {deliveries.map((delivery) => (
            <article key={delivery.id} className="rounded-[10px] border border-[var(--line)] bg-white p-4 transition hover:border-[var(--brand)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={delivery.status === "DELIVERED" ? "green" : delivery.status === "CANCELLED" ? "red" : "blue"}>{titleCase(delivery.status)}</Badge>
                  <Link href={`/deliveries/${delivery.id}`} className="mt-2 inline-flex text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{delivery.request.productName}</Link>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rider: {delivery.rider.user.name || "Unnamed rider"} - {compactDate(delivery.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 text-right">
                  <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(delivery.deliveryFee))}</p>
                  <AdminDeleteButton endpoint={`/api/admin/deliveries/${delivery.id}?type=delivery`} label="Delete delivery" confirmText="Delete this delivery record?" />
                </div>
              </div>
            </article>
          ))}
          {!deliveries.length ? <EmptyState title="No deliveries yet" description="Accepted delivery requests will appear here." icon={MapPinned} /> : null}
        </div>
      </section>

      <section className="mt-5 app-panel p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Open delivery reports</h2>
        <div className="mt-4 grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-[10px] border border-red-100 bg-red-50 p-4">
              <Badge tone="red">{titleCase(report.reason)}</Badge>
              <h3 className="mt-2 text-sm font-black text-red-950">{report.delivery.request.productName}</h3>
              <p className="mt-1 text-xs text-red-800">Reported by {report.reporter.name || "User"} - {compactDate(report.createdAt)}</p>
              {report.details ? <p className="mt-2 text-xs text-red-800">{report.details}</p> : null}
            </article>
          ))}
          {!reports.length ? <EmptyState title="No open delivery reports" description="Buyer and seller reports about riders will appear here." icon={Flag} /> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
