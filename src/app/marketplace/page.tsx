import Link from "next/link";
import type { ProductCondition } from "@/generated/prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/marketplace/product-card";
import { SearchFilters } from "@/components/marketplace/search-filters";
import { getCategories, getPublicProducts } from "@/lib/marketplace";

type SearchParams = Record<string, string | string[] | undefined>;

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const page = Math.max(1, Number(value(params, "page") ?? 1));
  const take = 18;
  const products = await getPublicProducts({
    q: value(params, "q"),
    category: value(params, "category"),
    location: value(params, "location"),
    area: value(params, "area"),
    condition: value(params, "condition") as ProductCondition | undefined,
    sort: value(params, "sort") as "featured" | "newest" | "price_low" | "price_high" | "popular" | "nearest" | undefined,
    min: value(params, "min") ? Number(value(params, "min")) : undefined,
    max: value(params, "max") ? Number(value(params, "max")) : undefined,
    take,
    skip: (page - 1) * take,
  });
  const nextParams = new URLSearchParams();
  const prevParams = new URLSearchParams();
  Object.entries(params).forEach(([key, raw]) => {
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (item && key !== "page") {
      nextParams.set(key, item);
      prevParams.set(key, item);
    }
  });
  nextParams.set("page", String(page + 1));
  prevParams.set("page", String(Math.max(1, page - 1)));

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Marketplace</p>
        <h1 className="mt-1 text-xl font-black text-[var(--ink)]">Products near Dunkwa-on-Offin</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Search, filter, save favorites, and contact sellers directly. Listings are designed around chat-first buying, not online checkout.
        </p>
      </div>

      <SearchFilters categories={categories} />

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-[var(--muted)]">
          {products.length} product{products.length === 1 ? "" : "s"} available
        </p>
      </div>

      {products.length ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {page > 1 ? (
              <Link href={`/marketplace?${prevParams.toString()}`} className="inline-flex min-h-10 items-center rounded-[7px] border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--brand-dark)]">
                Previous
              </Link>
            ) : null}
            {products.length === take ? (
              <Link href={`/marketplace?${nextParams.toString()}`} className="inline-flex min-h-10 items-center rounded-[7px] bg-[var(--brand)] px-4 text-xs font-bold text-white">
                Next page
              </Link>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="No matching products yet"
            description="Try a wider price range or browse all categories. More Dunkwa sellers can add listings from the seller dashboard."
            actionHref="/marketplace"
            actionLabel="Clear filters"
          />
        </div>
      )}
    </div>
  );
}
