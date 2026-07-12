import Image from "next/image";
import { ChefHat, GitCompareArrows, Heart, MapPin, MessageCircle, Search, ShoppingBag, Star, Store, UserRound, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerFollowingPage() {
  const session = await requireUser();
  const follows = await prisma.storeFollower.findMany({
    where: { userId: session.user.id },
    include: {
      store: {
        include: {
          _count: { select: { products: true, followers: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Following"
      description="Stores you follow so you can quickly return to trusted sellers."
      links={[
        { href: "/buyer", label: "Overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/buyer/food-orders", label: "Food orders", icon: ChefHat },
        { href: "/buyer/following", label: "Following", icon: Users },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/buyer/compare", label: "Compare", icon: GitCompareArrows },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      {follows.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {follows.map(({ store, createdAt }) => (
            <article key={store.id} className="app-panel overflow-hidden">
              <div className="relative h-24 bg-[var(--surface-muted)]">
                {store.coverUrl ? <Image src={store.coverUrl} alt={store.name} fill className="object-cover" unoptimized /> : null}
              </div>
              <div className="p-4">
                <div className="-mt-11 flex items-end gap-3">
                  <div className="relative grid size-16 place-items-center overflow-hidden rounded-[8px] border-4 border-white bg-[var(--brand)] text-white shadow-sm">
                    {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} fill className="object-cover" unoptimized /> : <Store size={24} />}
                  </div>
                  <div className="pb-1">
                    <h2 className="text-sm font-black text-[var(--ink)]">{store.name}</h2>
                    <p className="mt-1 text-[0.7rem] text-[var(--muted)]">Followed {compactDate(createdAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {store.isVerified ? <Badge tone="green">Verified</Badge> : null}
                  <Badge tone="gold"><Star size={12} /> {store.ratingAverage.toFixed(1)}</Badge>
                  <Badge tone="blue">{store._count.followers} followers</Badge>
                </div>
                <p className="mt-3 flex items-center gap-1 text-xs text-[var(--muted)]"><MapPin size={14} /> {store.area ? `${store.area}, ${store.location}` : store.location}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ButtonLink href={`/stores/${store.slug}`} className="min-h-9 px-3">Open store</ButtonLink>
                  <ButtonLink href={`/marketplace?store=${store.slug}`} variant="secondary" className="min-h-9 px-3">Products</ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No followed stores yet"
          description="Open a seller store and tap Follow store. Your favorite sellers will appear here."
          actionHref="/marketplace"
          actionLabel="Browse marketplace"
        />
      )}
    </DashboardShell>
  );
}
