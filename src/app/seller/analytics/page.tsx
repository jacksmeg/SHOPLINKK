import { BarChart3, Eye, Heart, MessageCircle, PackageCheck, Star, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerAnalyticsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [products, favorites, chats, followers, reviews, orders] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: session.user.id }, orderBy: { viewCount: "desc" }, take: 8 }),
    prisma.favorite.count({ where: { product: { sellerId: session.user.id } } }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
    prisma.storeFollower.count({ where: { store: { ownerId: session.user.id } } }),
    prisma.review.findMany({ where: { sellerId: session.user.id } }),
    prisma.foodOrder.findMany({ where: { store: { ownerId: session.user.id }, status: { not: "CANCELLED" } } }),
  ]);

  const views = products.reduce((sum, product) => sum + product.viewCount, 0);
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const conversion = views ? Math.round(((chats + orders.length) / views) * 100) : 0;

  return (
    <DashboardShell eyebrow="Seller" title="Store analytics" description="Track visits, sales value, product interest, followers, reviews, and conversion rate." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Store visits" value={views} icon={Eye} helper="Product view total" tone="sea" />
        <StatCard label="Revenue" value={formatCurrency(revenue)} icon={BarChart3} helper="Food order value" tone="pink" />
        <StatCard label="Conversion rate" value={`${conversion}%`} icon={PackageCheck} helper="Chats + orders / views" tone="yellow" />
        <StatCard label="Average rating" value={average ? average.toFixed(1) : "0.0"} icon={Star} helper={`${reviews.length} reviews`} tone="purple" />
        <StatCard label="Favorites" value={favorites} icon={Heart} helper="Saved by buyers" tone="red" />
        <StatCard label="Messages" value={chats} icon={MessageCircle} helper="Buyer conversations" tone="blue" />
        <StatCard label="Followers" value={followers} icon={Users} helper="Store audience" tone="sea" />
        <StatCard label="Repeat customers" value={orders.length} icon={PackageCheck} helper="Food orders placed" tone="pink" />
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
