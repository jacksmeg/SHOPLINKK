import { Bell, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerFollowersPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const followers = await prisma.storeFollower.findMany({
    where: { store: { ownerId: session.user.id } },
    include: { user: { select: { name: true, email: true, phone: true, location: true, area: true } } },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return (
    <DashboardShell eyebrow="Seller" title="Followers" description="People who follow your store and want updates about your products, food, and promotions." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Total followers" value={followers.length} icon={Users} helper="Store audience" tone="sea" />
        <StatCard label="Promotion reach" value={followers.length ? "Ready" : "Build audience"} icon={Bell} helper="Followers can receive future alerts" tone="pink" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {followers.map((follow) => (
          <div key={follow.id} className="app-panel p-4">
            <p className="text-sm font-black text-[var(--ink)]">{follow.user.name || follow.user.email || "ShopLinkk buyer"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{follow.user.phone || "No phone"} - {follow.user.area || follow.user.location || "Ghana"}</p>
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Followed {compactDate(follow.createdAt)}</p>
          </div>
        ))}
        {!followers.length ? <p className="text-xs text-[var(--muted)]">Followers will appear here when buyers follow your public store.</p> : null}
      </div>
    </DashboardShell>
  );
}
