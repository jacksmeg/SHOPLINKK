import Link from "next/link";
import { BadgeCheck, ShieldCheck, Store, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  await requireRole(["ADMIN"]);
  const [sellerRequests, riders, stores] = await Promise.all([
    prisma.sellerVerification.findMany({ include: { seller: true, store: true }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.riderProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.store.count({ where: { verificationStatus: "PENDING" } }),
  ]);
  return (
    <DashboardShell eyebrow="Admin" title="Verification center" description="Approve seller documents, restaurant documents, rider documents, Ghana Cards, and business trust badges." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Seller requests" value={sellerRequests.length} icon={ShieldCheck} helper={`${stores} store profiles pending`} tone="sea" />
        <StatCard label="Rider requests" value={riders.filter((rider) => rider.status === "PENDING").length} icon={Truck} helper="Pending rider documents" tone="pink" />
        <StatCard label="Verified stores" value={sellerRequests.filter((item) => item.status === "VERIFIED").length} icon={BadgeCheck} helper="Approved seller docs" tone="yellow" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Seller documents</h2>
          <div className="mt-4 grid gap-3">
            {sellerRequests.map((request) => (
              <article key={request.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex justify-between gap-3"><p className="text-xs font-black text-[var(--ink)]">{request.businessName || request.store?.name || request.seller.name || "Seller"}</p><Badge tone={request.status === "VERIFIED" ? "green" : request.status === "REJECTED" ? "red" : "gold"}>{titleCase(request.status)}</Badge></div>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{request.seller.email || request.seller.phone} - {compactDate(request.createdAt)}</p>
                {request.documentUrl ? <Link className="mt-2 inline-flex text-xs font-black text-[var(--brand-dark)]" href={request.documentUrl}>View document</Link> : null}
              </article>
            ))}
          </div>
        </section>
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Rider documents</h2>
          <div className="mt-4 grid gap-3">
            {riders.map((rider) => (
              <article key={rider.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex justify-between gap-3"><p className="text-xs font-black text-[var(--ink)]">{rider.user.name || rider.user.email || rider.user.phone}</p><Badge tone={rider.status === "APPROVED" ? "green" : rider.status === "REJECTED" || rider.status === "SUSPENDED" ? "red" : "gold"}>{titleCase(rider.status)}</Badge></div>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{titleCase(rider.vehicleType || "MOTORCYCLE")} - {compactDate(rider.createdAt)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
