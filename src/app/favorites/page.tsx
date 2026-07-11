import { Bell, FolderHeart, Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/marketplace/product-card";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await requireUser();
  const [favorites, folders] = await Promise.all([
    prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              phone: true,
              logoUrl: true,
              isVerified: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              phone: true,
              location: true,
            },
          },
          images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteFolder.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { favorites: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const products = favorites.map((favorite) => ({
    ...favorite.product,
    price: Number(favorite.product.price),
    salePrice: favorite.product.salePrice ? Number(favorite.product.salePrice) : null,
    saleStartsAt: favorite.product.saleStartsAt?.toISOString() ?? null,
    saleEndsAt: favorite.product.saleEndsAt?.toISOString() ?? null,
  }));

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Favorites"
      description="Products you saved for later."
      links={[
        { href: "/buyer", label: "Overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/buyer/saved-searches", label: "Saved searches", icon: Bell },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      {folders.length ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <span key={folder.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-dark)]">
              <FolderHeart size={16} />
              {folder.name} ({folder._count.favorites})
            </span>
          ))}
        </div>
      ) : null}
      {products.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No favorites yet"
          description="Save products while browsing the marketplace and they will appear here."
          actionHref="/marketplace"
          actionLabel="Browse products"
        />
      )}
    </DashboardShell>
  );
}
