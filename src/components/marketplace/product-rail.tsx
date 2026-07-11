import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PublicProduct } from "@/lib/marketplace";
import { ProductCard } from "@/components/marketplace/product-card";

export function ProductRail({ products, title, eyebrow = "Suggested", href }: { products: PublicProduct[]; title: string; eyebrow?: string; href?: string }) {
  if (!products.length) return null;
  return (
    <div className="product-rail">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]"><Sparkles size={13} /> {eyebrow}</p><h2 className="mt-1 text-lg font-black text-[var(--ink)]">{title}</h2></div>
        {href ? <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--brand-dark)]">See all <ArrowRight size={14} /></Link> : null}
      </div>
      <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
        {products.map((product) => <div key={product.id} className="w-[244px] shrink-0 snap-start sm:w-[278px]"><ProductCard product={product} /></div>)}
      </div>
    </div>
  );
}
