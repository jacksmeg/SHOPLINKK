import { Activity, Boxes, Flag, PlugZap, Rocket, ShieldCheck, Store, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { adminLinks } from "@/lib/admin-navigation";
import { getIntegrationSummaries } from "@/lib/integration-settings";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[var(--muted)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);
  const [users, sellers, products, pending, reports, categories, roleGroups, listingGroups, reportGroups, boosts, verifiedSellers, integrations] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.product.count(),
    prisma.product.count({ where: { listingStatus: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.category.count(),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    prisma.product.groupBy({ by: ["listingStatus"], _count: { listingStatus: true } }),
    prisma.report.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.productBoostRequest.count({ where: { status: "REQUESTED" } }),
    prisma.store.count({ where: { isVerified: true } }),
    getIntegrationSummaries(),
  ]);
  const connectedIntegrations = integrations.filter((item) => item.enabled && item.configured).length;

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Dashboard"
      description="Marketplace health, moderation queues, provider connections, and operational controls."
      links={adminLinks}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users} icon={Users} helper="All roles" />
        <StatCard label="Sellers" value={sellers} icon={Store} helper="Seller accounts" />
        <StatCard label="Products" value={products} icon={Boxes} helper="All listing states" />
        <StatCard label="Pending listings" value={pending} icon={ShieldCheck} helper="Need approval" />
        <StatCard label="Open reports" value={reports} icon={Flag} helper="Need review" />
        <StatCard label="Boost requests" value={boosts} icon={Rocket} helper="Awaiting decision" />
        <StatCard label="Verified stores" value={verifiedSellers} icon={ShieldCheck} helper="Trusted sellers" />
        <StatCard label="API connections" value={`${connectedIntegrations}/${integrations.length}`} icon={PlugZap} helper="Enabled providers" />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black text-[var(--ink)]">Moderation queue</h2><p className="mt-1 text-xs text-[var(--muted)]">Items needing an admin decision.</p></div><Activity size={18} className="text-[var(--brand)]" /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ButtonLink href="/admin/products?status=PENDING" variant="secondary" className="justify-between">{pending} listings <Boxes size={15} /></ButtonLink>
            <ButtonLink href="/admin/reports?status=OPEN" variant="secondary" className="justify-between">{reports} reports <Flag size={15} /></ButtonLink>
            <ButtonLink href="/admin/boosts" variant="secondary" className="justify-between">{boosts} boosts <Rocket size={15} /></ButtonLink>
          </div>
        </section>
        <section className="app-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black text-[var(--ink)]">System connections</h2><p className="mt-1 text-xs text-[var(--muted)]">Production service readiness.</p></div><Badge tone={connectedIntegrations === integrations.length ? "green" : "gold"}>{connectedIntegrations}/{integrations.length} ready</Badge></div>
          <div className="mt-4 flex flex-wrap gap-2">{integrations.map((item) => <Badge key={item.provider} tone={item.enabled && item.configured ? "green" : "neutral"}>{item.provider.replaceAll("_", " ")}</Badge>)}</div>
          <ButtonLink href="/admin/integrations" variant="ghost" className="mt-3 px-0">Manage connections <PlugZap size={14} /></ButtonLink>
        </section>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Users by role</h2>
          <div className="mt-4 space-y-4">
            {roleGroups.map((group) => (
              <BarRow key={group.role} label={group.role} value={group._count.role} total={users} />
            ))}
          </div>
        </section>
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Listings by status</h2>
          <div className="mt-4 space-y-4">
            {listingGroups.map((group) => (
              <BarRow key={group.listingStatus} label={group.listingStatus} value={group._count.listingStatus} total={products} />
            ))}
          </div>
        </section>
        <section className="app-panel p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Reports by status</h2>
          <div className="mt-4 space-y-4">
            {reportGroups.length ? (
              reportGroups.map((group) => (
                <BarRow key={group.status} label={group.status} value={group._count.status} total={reportGroups.reduce((sum, item) => sum + item._count.status, 0)} />
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No reports yet.</p>
            )}
          </div>
        </section>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-5">
        <span className="mr-2 text-xs font-semibold text-[var(--muted)]">Export:</span>
        <ButtonLink href="/api/admin/export/users" variant="secondary">Users CSV</ButtonLink>
        <ButtonLink href="/api/admin/export/products" variant="secondary">Products CSV</ButtonLink>
        <ButtonLink href="/api/admin/export/reports" variant="secondary">Reports CSV</ButtonLink>
        <span className="ml-auto text-xs text-[var(--muted)]">{categories} active categories</span>
      </div>
    </DashboardShell>
  );
}
