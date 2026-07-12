import Image from "next/image";
import Link from "next/link";
import { Bell, ChefHat, GitCompareArrows, Heart, MessageCircle, Search, ShoppingBag, Store, UserRound, Users } from "lucide-react";
import { BecomeSellerButton } from "@/components/buyer/become-seller-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const session = await requireUser();
  const [favorites, chats, savedSearches, compareCount, followingCount, recentlyViewed, account] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.conversation.count({ where: { buyerId: session.user.id } }),
    prisma.savedSearch.count({ where: { userId: session.user.id } }),
    prisma.comparedProduct.count({ where: { userId: session.user.id } }),
    prisma.storeFollower.count({ where: { userId: session.user.id } }),
    prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            category: true,
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 4,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, emailVerified: true, phoneVerifiedAt: true },
    }),
  ]);

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Dashboard"
      description="Saved products, chats, and local buying shortcuts."
      links={[
        { href: "/buyer", label: "Overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/buyer/food-orders", label: "Food orders", icon: ChefHat },
        { href: "/buyer/following", label: "Following", icon: Users },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/buyer/saved-searches", label: "Saved searches", icon: Bell },
        { href: "/buyer/compare", label: "Compare", icon: GitCompareArrows },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Saved products" value={favorites} icon={Heart} helper="Favorites stay private to you" />
        <StatCard label="Product chats" value={chats} icon={MessageCircle} helper="Every chat is tied to one listing" />
        <StatCard label="Saved searches" value={savedSearches} icon={Bell} helper="Future price alerts" />
        <StatCard label="Compare list" value={compareCount} icon={GitCompareArrows} helper="Shortlisted products" />
        <StatCard label="Following" value={followingCount} icon={Users} helper="Stores you follow" />
      </div>
      <div className="mt-5 app-panel p-4 sm:p-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Start shopping locally</h2>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Browse approved listings, save products, and message sellers directly before agreeing on pickup, inspection, or purchase.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/marketplace">Browse marketplace</ButtonLink>
          <ButtonLink href="/favorites" variant="secondary">View favorites</ButtonLink>
          <ButtonLink href="/buyer/saved-searches" variant="secondary">Saved searches</ButtonLink>
          <ButtonLink href="/buyer/following" variant="secondary">Following</ButtonLink>
          <ButtonLink href="/buyer/compare" variant="secondary">Compare products</ButtonLink>
        </div>
        {account?.role === "BUYER" ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
            <div className="flex items-start gap-2.5">
              <Store className="mt-0.5 text-[var(--brand)]" size={18} />
              <div>
                <h3 className="text-xs font-black text-[var(--ink)]">Ready to sell too?</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Open your store, manage listings, and speak directly with buyers.</p>
              </div>
            </div>
            <BecomeSellerButton verified={Boolean(account.phoneVerifiedAt || account.emailVerified)} />
          </div>
        ) : null}
      </div>
      <section className="mt-6 border-t border-[var(--line)] pt-5">
        <h2 className="text-sm font-black text-[var(--ink)]">Recently viewed</h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {recentlyViewed.map(({ product }) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="rounded-[8px] border border-[var(--line)] p-2.5 transition hover:border-[var(--brand)] hover:shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                {product.images[0]?.url ? <Image src={product.images[0].url} alt={product.title} fill className="object-cover" unoptimized /> : null}
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-black text-[var(--ink)]">{product.title}</p>
              <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</p>
            </Link>
          ))}
          {!recentlyViewed.length ? (
            <p className="text-sm text-[var(--muted)]">Products you open will appear here.</p>
          ) : null}
        </div>
      </section>
      <div className="mt-6 rounded-[8px] bg-[var(--brand-soft)] p-4 text-xs leading-5 text-[var(--brand-dark)]">
        <strong>Safety reminder:</strong> ShopLinkk does not take online payment yet. Chat first, inspect the item, meet safely, and report suspicious behavior.
      </div>
      <Link href="/terms" className="mt-4 inline-flex text-sm font-bold text-[var(--brand-dark)]">
        Read safety terms
      </Link>
    </DashboardShell>
  );
}
