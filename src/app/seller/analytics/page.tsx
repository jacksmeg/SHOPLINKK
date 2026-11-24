import { BarChart3, Eye, Heart, MessageCircle, PackageCheck, Star, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerAnalyticsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const sellerId = session.user.id;
  const store = await prisma.store.findUnique({ where: { ownerId: sellerId }, select: { kind: true } });
  const [products, favorites, chats, followers, rating, traffic, foodBuyers, marketplaceBuyers] = await Promise.all([
    prisma.product.findMany({ where: { sellerId }, orderBy: { viewCount: "desc" }, take: 8 }),
    prisma.favorite.count({ where: { product: { sellerId } } }),
    prisma.conversation.count({ where: { sellerId } }),
    prisma.storeFollower.count({ where: { store: { ownerId: sellerId } } }),
    prisma.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: true }),
    prisma.storeTrafficDaily.aggregate({ where: { store: { ownerId: sellerId } }, _sum: { visits: true, whatsappClicks: true } }),
    prisma.foodOrder.groupBy({
      by: ["buyerId"], where: { store: { ownerId: sellerId }, status: "DELIVERED" },
      _sum: { totalAmount: true }, _count: { _all: true },
    }),
    prisma.marketplaceOrder.groupBy({
      by: ["buyerId"], where: { sellerId, status: "DELIVERED" },
      _sum: { totalAmount: true }, _count: { _all: true },
    }),
  ]);

  const buyerOrders = new Map<string, number>();
  let revenue = 0;
  for (const buyer of [...foodBuyers, ...marketplaceBuyers]) {
    buyerOrders.set(buyer.buyerId, (buyerOrders.get(buyer.buyerId) ?? 0) + buyer._count._all);
    revenue += Number(buyer._sum.totalAmount ?? 0);
  }
  const repeatCustomers = [...buyerOrders.values()].filter((count) => count >= 2).length;
  const average = rating._avg.rating;

  return (
    <DashboardShell eyebrow="Seller" title="Store analytics" description="Track storefront visits, buyer interest, and completed sales." links={sellerLinksForKind(store?.kind)}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Store visits" value={traffic._sum.visits ?? 0} icon={Eye} helper="Recorded storefront opens" tone="sea" />
        <StatCard label="Completed order value" value={formatCurrency(revenue)} icon={BarChart3} helper="Delivered orders before refunds" tone="pink" />
        <StatCard label="WhatsApp clicks" value={traffic._sum.whatsappClicks ?? 0} icon={MessageCircle} helper="From the public storefront" tone="yellow" />
        <StatCard label="Average rating" value={average ? average.toFixed(1) : "0.0"} icon={Star} helper={`${rating._count} reviews`} tone="purple" />
        <StatCard label="Favorites" value={favorites} icon={Heart} helper="Saved by buyers" tone="red" />
        <StatCard label="Messages" value={chats} icon={MessageCircle} helper="Buyer conversations" tone="blue" />
        <StatCard label="Followers" value={followers} icon={Users} helper="Store audience" tone="sea" />
        <StatCard label="Repeat customers" value={repeatCustomers} icon={PackageCheck} helper="Buyers with 2+ delivered orders" tone="pink" />
      </div>
      <section className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Top products</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-black text-[var(--ink)]">{product.title}</p>
                <p className="text-xs font-black text-[var(--brand-dark)]">{product.viewCount} views</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.max(6, Math.min(100, product.viewCount))}%` }} />
              </div>
            </div>
          ))}
          {!products.length ? <p className="text-xs text-[var(--muted)]">Top products will appear after buyers view your listings.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
