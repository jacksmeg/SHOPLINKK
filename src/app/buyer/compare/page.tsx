import Image from "next/image";
import Link from "next/link";
import { Bell, GitCompareArrows, Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const session = await requireUser();
  const items = await prisma.comparedProduct.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          store: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Compare Products"
      description="Compare price, condition, location, seller trust, and stock before contacting sellers."
      links={[
        { href: "/buyer", label: "Overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/buyer/saved-searches", label: "Saved searches", icon: Bell },
        { href: "/buyer/compare", label: "Compare", icon: GitCompareArrows },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      {items.length ? (
        <>
        <div className="grid gap-3 md:hidden">
          {items.map(({ product }) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="app-panel p-3.5">
              <div className="flex gap-3"><span className="relative size-16 shrink-0 overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">{product.images[0]?.url ? <Image src={product.images[0].url} alt={product.title} fill className="object-cover" unoptimized /> : null}</span><div className="min-w-0"><h2 className="line-clamp-2 text-sm font-black text-[var(--ink)]">{product.title}</h2><p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(product.condition)} · {product.area ? `${product.area}, ${product.location}` : product.location}</p><p className="mt-1 text-xs text-[var(--muted)]">Trust {product.store?.trustScore ?? 50}% · {titleCase(product.stockStatus)}</p></div></div>
            </Link>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-[8px] border border-[var(--line)] bg-white md:block">
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Seller trust</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {items.map(({ product }) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4">
                      <Link href={`/products/${product.slug}`} className="flex items-center gap-3 font-black text-[var(--ink)] hover:text-[var(--brand)]">
                        <span className="relative size-14 overflow-hidden rounded-[8px] bg-blue-50">
                          {product.images[0]?.url ? <Image src={product.images[0].url} alt={product.title} fill className="object-cover" unoptimized /> : null}
                        </span>
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{formatCurrency(Number(product.price))}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{titleCase(product.condition)}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{product.area ? `${product.area}, ${product.location}` : product.location}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{product.store?.trustScore ?? 50}%</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{titleCase(product.stockStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <EmptyState
          title="No products selected"
          description="Open a product and tap Compare to build a shortlist."
          actionHref="/marketplace"
          actionLabel="Browse marketplace"
        />
      )}
    </DashboardShell>
  );
}
