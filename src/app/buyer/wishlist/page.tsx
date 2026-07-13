import { Heart, PackageCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BuyerWishlistPage() {
  const session = await requireUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { category: true, store: true, seller: true, images: { orderBy: { sortOrder: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  });
  const products = favorites.map((favorite) => ({
    ...favorite.product,
    price: Number(favorite.product.price),
    salePrice: favorite.product.salePrice ? Number(favorite.product.salePrice) : null,
    saleStartsAt: favorite.product.saleStartsAt?.toISOString() ?? null,
    saleEndsAt: favorite.product.saleEndsAt?.toISOString() ?? null,
  }));

  return (
    <DashboardShell eyebrow="Buyer" title="Wishlist" description="Products saved for later, back-in-stock alerts, and future coupon reminders." links={buyerLinks}>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Wishlist items" value={products.length} icon={Heart} helper="Saved products" tone="pink" />
        <StatCard label="Back in stock alerts" value="Ready" icon={PackageCheck} helper="Future notification support" tone="sea" />
      </div>
      {products.length ? <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No wishlist items yet" description="Save products from the marketplace and they will appear here." />}
    </DashboardShell>
  );
}
