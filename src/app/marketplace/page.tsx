import Link from "next/link";
import { ChefHat, PackageSearch, Wrench } from "lucide-react";
import type { ListingType, ProductCondition } from "@/generated/prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { FoodCard } from "@/components/marketplace/food-card";
import { ProductCard } from "@/components/marketplace/product-card";
import { SearchFilters } from "@/components/marketplace/search-filters";
import { getPublicFoodItems } from "@/lib/food";
import { getCategories, getPublicProducts } from "@/lib/marketplace";

type SearchParams = Record<string, string | string[] | undefined>;
type MarketplaceMode = "products" | "food" | "services";

function value(params: SearchParams, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function modeFromParams(params: SearchParams): MarketplaceMode {
  const raw = value(params, "type");
  if (raw === "food" || raw === "services") return raw;
  return "products";
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
  const mode = modeFromParams(params);
  const products = mode === "food" ? [] : await getPublicProducts({
    q: value(params, "q"),
    category: value(params, "category"),
    location: value(params, "location"),
    area: value(params, "area"),
    condition: value(params, "condition") as ProductCondition | undefined,
    listingType: mode === "services" ? "SERVICE" as ListingType : undefined,
    sort: value(params, "sort") as "featured" | "newest" | "price_low" | "price_high" | "popular" | "nearest" | undefined,
    min: value(params, "min") ? Number(value(params, "min")) : undefined,
    max: value(params, "max") ? Number(value(params, "max")) : undefined,
    take,
    skip: (page - 1) * take,
  });
  const foodItems = mode === "food" ? await getPublicFoodItems({
    q: value(params, "q"),
    category: value(params, "category"),
    location: value(params, "location"),
    area: value(params, "area"),
    min: value(params, "min") ? Number(value(params, "min")) : undefined,
    max: value(params, "max") ? Number(value(params, "max")) : undefined,
    take,
    skip: (page - 1) * take,
  }) : [];
  const resultCount = mode === "food" ? foodItems.length : products.length;
  const resultLabel = mode === "food" ? "food item" : mode === "services" ? "service" : "listing";
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
        <h1 className="mt-1 text-xl font-black text-[var(--ink)]">Browse near Dunkwa-on-Offin</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Switch between products, services, and food ordering. Buy locally, chat clearly, and order food from nearby sellers.
        </p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/marketplace", label: "Products & services", mode: "products", icon: PackageSearch },
          { href: "/marketplace?type=food", label: "Food", mode: "food", icon: ChefHat },
          { href: "/marketplace?type=services", label: "Services", mode: "services", icon: Wrench },
        ].map((item) => {
          const active = mode === item.mode;
          return (
            <Link
              key={item.mode}
              href={item.href}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[8px] border px-3 text-xs font-black transition ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-sm" : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand-dark)]"}`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <SearchFilters categories={categories} kind={mode} />

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-[var(--muted)]">
          {resultCount} {resultLabel}{resultCount === 1 ? "" : "s"} available
        </p>
      </div>

      {mode === "food" && foodItems.length ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {foodItems.map((item, index) => (
              <FoodCard key={item.id} item={item} priority={index < 3} />
            ))}
          </div>
          <Pagination page={page} showNext={foodItems.length === take} prevParams={prevParams} nextParams={nextParams} />
        </>
      ) : products.length ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
          <Pagination page={page} showNext={products.length === take} prevParams={prevParams} nextParams={nextParams} />
        </>
      ) : (
        <div className="mt-5">
          <EmptyState
            title={mode === "food" ? "No matching food yet" : "No matching products yet"}
            description={mode === "food" ? "Try another food name or area. Food sellers can add menu items from the seller food dashboard." : "Try a wider price range or browse all categories. More Dunkwa sellers can add listings from the seller dashboard."}
            actionHref="/marketplace"
            actionLabel="Clear filters"
          />
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  showNext,
  prevParams,
  nextParams,
}: {
  page: number;
  showNext: boolean;
  prevParams: URLSearchParams;
  nextParams: URLSearchParams;
}) {
  if (page <= 1 && !showNext) return null;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {page > 1 ? (
        <Link href={`/marketplace?${prevParams.toString()}`} className="inline-flex min-h-10 items-center rounded-[7px] border border-[var(--line)] bg-white px-4 text-xs font-bold text-[var(--brand-dark)]">
          Previous
        </Link>
      ) : null}
      {showNext ? (
        <Link href={`/marketplace?${nextParams.toString()}`} className="inline-flex min-h-10 items-center rounded-[7px] bg-[var(--brand)] px-4 text-xs font-bold text-white">
          Next page
        </Link>
      ) : null}
    </div>
  );
}
