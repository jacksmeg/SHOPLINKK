"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PublicCategory } from "@/lib/marketplace";
import { townLocations } from "@/lib/demo-data";
import { dunkwaAreas } from "@/lib/ghana";
import { Button } from "@/components/ui/button";
import { SearchSuggestBox } from "@/components/marketplace/search/search-suggest-box";

export function SearchFilters({
  categories,
  kind = "products",
}: {
  categories: PublicCategory[];
  kind?: "products" | "food" | "services";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [advanced, setAdvanced] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [area, setArea] = useState(searchParams.get("area") ?? "");
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "featured");
  const [min, setMin] = useState(searchParams.get("min") ?? "");
  const [max, setMax] = useState(searchParams.get("max") ?? "");

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (kind !== "products") params.set("type", kind);
    for (const [key, value] of Object.entries({ q, category, location, area, condition, sort, min, max })) if (value) params.set(key, value);
    router.push(`/marketplace?${params.toString()}`);
  }

  return (
    <form onSubmit={applyFilters} className="rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-sm sm:p-4">
      <div className="flex gap-2">
        <SearchSuggestBox value={q} onChange={setQ} className="min-w-0 flex-1" placeholder="Search products, services, stores..." />
        <Button type="submit" className="px-4"><Search size={15} /><span className="hidden sm:inline">Search</span></Button>
        <Button type="button" variant="secondary" onClick={() => setAdvanced((value) => !value)} className="lg:hidden" aria-expanded={advanced}>{advanced ? <X size={15} /> : <SlidersHorizontal size={15} />}<span className="hidden sm:inline">Filters</span></Button>
      </div>
      <div className={`${advanced ? "grid" : "hidden"} mt-3 gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-4`}>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-control bg-white px-3 text-xs"><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select value={location} onChange={(event) => setLocation(event.target.value)} className="form-control bg-white px-3 text-xs"><option value="">All locations</option>{townLocations.map((town) => <option key={town} value={town}>{town}</option>)}</select>
        <select value={area} onChange={(event) => setArea(event.target.value)} className="form-control bg-white px-3 text-xs"><option value="">Any Dunkwa area</option>{dunkwaAreas.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={condition} onChange={(event) => setCondition(event.target.value)} className="form-control bg-white px-3 text-xs"><option value="">Any condition</option><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></select>
        <input value={min} onChange={(event) => setMin(event.target.value)} placeholder="Minimum price" type="number" className="form-control px-3 text-xs" />
        <input value={max} onChange={(event) => setMax(event.target.value)} placeholder="Maximum price" type="number" className="form-control px-3 text-xs" />
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="form-control bg-white px-3 text-xs"><option value="featured">Featured first</option><option value="newest">Newest first</option><option value="price_low">Lowest price</option><option value="price_high">Highest price</option><option value="popular">Most viewed</option><option value="nearest">Nearest area</option></select>
        <Button type="submit"><SlidersHorizontal size={15} /> Apply filters</Button>
      </div>
    </form>
  );
}
