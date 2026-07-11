import Link from "next/link";
import { MapPin, MessageCircle, Search, ShieldCheck, Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CategoryTile } from "@/components/marketplace/category-tile";
import { ProductCard } from "@/components/marketplace/product-card";
import { HomeAdvertRail } from "@/components/marketplace/home-advert-rail";
import { NearbyTownMap } from "@/components/marketplace/nearby-town-map";
import { ProductRail } from "@/components/marketplace/product-rail";
import { getCategories, getFeaturedProducts, getHomepageAdverts, getLatestProducts, getPlatformStats, getPublicTowns } from "@/lib/marketplace";

export default async function Home() {
  const [categories, featured, latest, stats, adverts, towns] = await Promise.all([getCategories(), getFeaturedProducts(), getLatestProducts(), getPlatformStats(), getHomepageAdverts(), getPublicTowns()]);
  const picks = featured.length ? featured : latest.slice(0, 8);

  return (
    <div className="page-enter bg-white">
      <section className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand)]"><MapPin size={14} /> Dunkwa-on-Offin, Ghana</div>
              <h1 className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">ShopLinkk local marketplace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Find nearby products, inspect them, and speak directly with the seller. No online payment is required.</p>
            </div>
            <div className="flex gap-2"><ButtonLink href="/marketplace" variant="secondary"><Search size={15} /> Browse all</ButtonLink><ButtonLink href="/register"><Store size={15} /> Start selling</ButtonLink></div>
          </div>

          <form action="/marketplace" className="mt-6 flex max-w-4xl gap-2 rounded-[8px] border border-[var(--line-strong)] bg-white p-2 shadow-lg">
            <label className="relative min-w-0 flex-1"><span className="sr-only">Search ShopLinkk</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} /><input name="q" placeholder="What are you looking for?" className="min-h-11 w-full rounded-[6px] border-0 bg-[var(--surface-muted)] pl-10 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/15" /></label>
            <button className="min-h-11 rounded-[7px] bg-[var(--brand)] px-5 text-xs font-bold text-white transition hover:bg-[var(--brand-dark)]">Search</button>
          </form>

          <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            {categories.slice(0, 10).map((category) => <Link key={category.slug} href={`/marketplace?category=${category.slug}`} className="shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">{category.name}</Link>)}
          </div>
        </div>
      </section>

      <HomeAdvertRail adverts={adverts} />

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <ProductRail products={picks.slice(0, 8)} title="Featured near you" eyebrow="Local picks" href="/marketplace?sort=featured" />
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface-muted)]">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[{ icon: MessageCircle, title: "Chat before buying", text: "Ask questions and agree on inspection directly." }, { icon: ShieldCheck, title: "Reviewed marketplace", text: "Admins can review listings, reports, and sellers." }, { icon: MapPin, title: "Built for local trade", text: `${stats.products}+ listings across ${stats.categories} categories.` }].map((item) => <div key={item.title} className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[7px] bg-white text-[var(--brand)] shadow-sm"><item.icon size={17} /></span><div><h3 className="text-xs font-bold text-[var(--ink)]">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.text}</p></div></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Browse by category</p><h2 className="mt-1 text-lg font-black text-[var(--ink)]">Everyday buying and selling</h2></div><Link href="/categories" className="text-xs font-bold text-[var(--brand-dark)]">All categories</Link></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">{categories.slice(0, 8).map((category) => <CategoryTile key={category.slug} category={category} />)}</div>
      </section>

      <NearbyTownMap towns={towns} />

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Just added</p><h2 className="mt-1 text-lg font-black text-[var(--ink)]">Latest products</h2></div><Link href="/marketplace?sort=newest" className="text-xs font-bold text-[var(--brand-dark)]">See newest</Link></div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{latest.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </div>
  );
}
