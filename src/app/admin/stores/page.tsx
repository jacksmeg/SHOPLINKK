import Link from "next/link";
import { BadgeCheck, PackageCheck, Star, Store, Users } from "lucide-react";
import { AdminStoreActions } from "@/components/admin/admin-store-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  await requireRole(["ADMIN"]);
  const stores = await prisma.store.findMany({
    include: { owner: { select: { name: true, email: true, phone: true } }, _count: { select: { products: true, followers: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <DashboardShell eyebrow="Admin" title="Store management" description="Approve, verify, feature, suspend, and inspect seller stores." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stores" value={stores.length} icon={Store} helper="All seller stores" tone="sea" />
        <StatCard label="Verified" value={stores.filter((store) => store.isVerified).length} icon={BadgeCheck} helper="Trusted stores" tone="pink" />
        <StatCard label="Products" value={stores.reduce((sum, store) => sum + store._count.products, 0)} icon={PackageCheck} helper="Connected listings" tone="yellow" />
        <StatCard label="Followers" value={stores.reduce((sum, store) => sum + store._count.followers, 0)} icon={Users} helper="Store audience" tone="purple" />
      </div>
      <div className="mt-5 overflow-hidden rounded-[8px] border border-[var(--line)] bg-white">
        <table className="data-table w-full min-w-[900px] text-left text-xs">
          <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]"><tr><th className="px-4 py-3">Store</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Trust</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Followers</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Admin action</th></tr></thead>
          <tbody className="divide-y divide-[var(--line)]">
            {stores.map((store) => (
              <tr key={store.id}>
                <td className="px-4 py-4"><Link href={`/stores/${store.slug}`} className="font-black text-[var(--brand-dark)]">{store.name}</Link><p className="mt-1 text-[0.68rem] text-[var(--muted)]">{store.area || store.location}</p></td>
                <td className="px-4 py-4 text-[var(--muted)]">{store.owner.name || store.owner.email || store.owner.phone}</td>
                <td className="px-4 py-4"><Badge tone={store.kind === "FOOD" ? "gold" : "neutral"}>{titleCase(store.kind)}</Badge></td>
                <td className="px-4 py-4"><Badge tone={store.isVerified ? "green" : "gold"}>{store.trustScore}% / {titleCase(store.verificationStatus)}</Badge></td>
                <td className="px-4 py-4">{store._count.products}</td>
                <td className="px-4 py-4">{store._count.followers}</td>
                <td className="px-4 py-4 text-[var(--muted)]">{compactDate(store.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/stores/${store.slug}`} className="inline-flex min-h-8 items-center rounded-[7px] border border-[var(--line)] px-2.5 text-[0.68rem] font-black text-[var(--brand-dark)]">View</Link>
                    <AdminStoreActions storeId={store.id} storeName={store.name} verified={store.isVerified} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
