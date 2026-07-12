import Link from "next/link";
import { FileBadge, Star, Truck } from "lucide-react";
import { AdminRiderActions } from "@/components/rider/admin-rider-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { adminLinks } from "@/lib/admin-navigation";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRidersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const q = params?.q?.trim();
  const status = params?.status?.trim();

  const riders = await prisma.riderProfile.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, phone: true, image: true } },
      deliveries: { select: { deliveryFee: true, status: true } },
      ratings: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totals = {
    pending: riders.filter((item) => item.status === "PENDING").length,
    approved: riders.filter((item) => item.status === "APPROVED").length,
    suspended: riders.filter((item) => item.status === "SUSPENDED").length,
  };

  return (
    <DashboardShell eyebrow="Admin" title="Rider management" description="Approve riders, inspect documents, suspend unsafe accounts, and monitor delivery performance." links={adminLinks}>
      <form className="mb-5 grid gap-2 rounded-[10px] border border-[var(--line)] bg-white p-3 sm:grid-cols-[1fr_180px_auto]">
        <input name="q" defaultValue={q ?? ""} placeholder="Search rider name, email, or phone" className="form-control px-3 text-xs" />
        <select name="status" defaultValue={status ?? ""} className="form-control bg-white px-3 text-xs">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button className="rounded-[8px] bg-[var(--brand)] px-4 text-xs font-black text-white">Search</button>
      </form>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] bg-cyan-600 p-4 text-white"><p className="text-xs font-bold">Pending review</p><p className="mt-2 text-xl font-black">{totals.pending}</p></div>
        <div className="rounded-[10px] bg-pink-600 p-4 text-white"><p className="text-xs font-bold">Approved riders</p><p className="mt-2 text-xl font-black">{totals.approved}</p></div>
        <div className="rounded-[10px] bg-red-600 p-4 text-white"><p className="text-xs font-bold">Suspended</p><p className="mt-2 text-xl font-black">{totals.suspended}</p></div>
      </div>

      <div className="grid gap-4">
        {riders.map((rider) => {
          const completed = rider.deliveries.filter((delivery) => delivery.status === "DELIVERED");
          const earnings = completed.reduce((sum, delivery) => sum + Number(delivery.deliveryFee), 0);
          const ratingAverage = rider.ratings.length ? rider.ratings.reduce((sum, rating) => sum + rating.rating, 0) / rider.ratings.length : 0;
          return (
            <article key={rider.id} className="app-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={rider.status === "APPROVED" ? "green" : rider.status === "SUSPENDED" ? "red" : "gold"}>{titleCase(rider.status)}</Badge>
                  <h2 className="mt-2 text-sm font-black text-[var(--ink)]">{rider.user.name || "Unnamed rider"}</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">{rider.user.email || "No email"} - {rider.user.phone || "No phone"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[var(--brand-dark)]">{formatCurrency(earnings)}</p>
                  <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold text-amber-600"><Star size={13} /> {ratingAverage ? ratingAverage.toFixed(1) : "New"}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-4">
                <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Vehicle: <strong>{titleCase(rider.vehicleType || "Not set")}</strong></p>
                <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Availability: <strong>{titleCase(rider.availability)}</strong></p>
                <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Completed: <strong>{completed.length}</strong></p>
                <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Reports: <strong>{0}</strong></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["Photo", rider.profilePhotoUrl],
                  ["Ghana Card", rider.ghanaCardUrl],
                  ["License", rider.licenseUrl],
                  ["Vehicle docs", rider.vehicleDocumentUrl],
                ].map(([label, url]) => (
                  url ? <Link key={label} href={url} target="_blank" className="inline-flex min-h-8 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-white px-3 text-[0.68rem] font-black text-[var(--ink)]"><FileBadge size={13} /> {label}</Link> : null
                ))}
              </div>
              {(rider.rejectionReason || rider.suspensionReason) ? <p className="mt-3 rounded-[8px] bg-red-50 p-3 text-xs font-bold text-red-700">{rider.rejectionReason || rider.suspensionReason}</p> : null}
              <AdminRiderActions riderId={rider.id} />
            </article>
          );
        })}
        {!riders.length ? <EmptyState title="No riders found" description="Rider applications will appear here." icon={Truck} /> : null}
      </div>
    </DashboardShell>
  );
}
