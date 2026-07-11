import Link from "next/link";
import { Bell, Heart, MessageCircle, Search, ShoppingBag, UserRound } from "lucide-react";
import { SavedSearchForm } from "@/components/buyer/saved-search-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/marketplace";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const session = await requireUser();
  const [categories, searches] = await Promise.all([
    getCategories(),
    prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <DashboardShell
      eyebrow="Buyer"
      title="Saved searches"
      description="Keep track of local products and turn on alerts for future price-drop notifications."
      links={[
        { href: "/buyer", label: "Buyer overview", icon: ShoppingBag },
        { href: "/marketplace", label: "Browse products", icon: Search },
        { href: "/favorites", label: "Favorites", icon: Heart },
        { href: "/buyer/saved-searches", label: "Saved searches", icon: Bell },
        { href: "/chat", label: "Chats", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <SavedSearchForm categories={categories} />
      <div className="mt-5 grid gap-3">
        {searches.map((search) => {
          const params = new URLSearchParams();
          if (search.query) params.set("q", search.query);
          if (search.category) params.set("category", search.category);
          if (search.location) params.set("location", search.location);
          if (search.minPrice) params.set("min", String(search.minPrice));
          if (search.maxPrice) params.set("max", String(search.maxPrice));

          return (
            <Link key={search.id} href={`/marketplace?${params.toString()}`} className="rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-black text-[var(--ink)]">{search.name}</h2>
                {search.alertsEnabled ? <Badge tone="green">Alerts on</Badge> : <Badge tone="neutral">Alerts off</Badge>}
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {search.query || "Any keyword"} · {search.category || "All categories"} · {search.location || "All locations"}
              </p>
              {(search.minPrice || search.maxPrice) ? (
                <p className="mt-1 text-sm font-bold text-[var(--brand-dark)]">
                  {search.minPrice ? formatCurrency(Number(search.minPrice)) : "Any"} - {search.maxPrice ? formatCurrency(Number(search.maxPrice)) : "Any"}
                </p>
              ) : null}
            </Link>
          );
        })}
        {!searches.length ? (
          <div className="rounded-[8px] border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)] shadow-sm">
            No saved searches yet.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}

