import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { PublicCategory } from "@/lib/marketplace";
import { CategoryIcon } from "@/components/marketplace/category-icon";

const categoryTones: Record<string, string> = {
  "phones-tablets": "category-tone-blue",
  electronics: "category-tone-violet",
  fashion: "category-tone-rose",
  vehicles: "category-tone-coral",
  "real-estate": "category-tone-sky",
  "home-furniture": "category-tone-cyan",
  "health-beauty": "category-tone-pink",
  "jobs-services": "category-tone-indigo",
  "food-groceries": "category-tone-lime",
  "building-materials": "category-tone-slate",
  "farm-products": "category-tone-emerald",
  other: "category-tone-blue",
};

const categoryPhotos: Record<string, string> = {
  "phones-tablets": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=420&q=80",
  electronics: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=420&q=80",
  fashion: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=420&q=80",
  vehicles: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=420&q=80",
  "real-estate": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=420&q=80",
  "home-furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=420&q=80",
  "health-beauty": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=420&q=80",
  "jobs-services": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=420&q=80",
  "food-groceries": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=420&q=80",
  "building-materials": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=420&q=80",
  "farm-products": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=420&q=80",
  other: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=420&q=80",
};

export function CategoryTile({ category }: { category: PublicCategory }) {
  const photo = category.icon?.startsWith("http") || category.icon?.startsWith("/")
    ? category.icon
    : categoryPhotos[category.slug];

  return (
    <Link
      href={`/marketplace?category=${category.slug}`}
      className="group overflow-hidden rounded-[8px] border border-[var(--line)] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-muted)]">
        {photo ? (
          <Image src={photo} alt={category.name} fill className="object-cover transition duration-300 group-hover:scale-105" unoptimized />
        ) : (
          <div className={`grid h-full place-items-center ${categoryTones[category.slug] ?? "category-tone-blue"}`}>
            <CategoryIcon name={category.icon} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061a3a]/55 to-transparent" />
        <div className={`absolute bottom-3 left-3 grid size-10 place-items-center rounded-[8px] border border-white/50 bg-white/95 ${categoryTones[category.slug] ?? "category-tone-blue"}`}>
          <CategoryIcon name={category.icon} />
        </div>
      </div>
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-black text-[var(--ink)]">{category.name}</h3>
          <ArrowRight className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--brand)]" size={18} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
          {category.description}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[0.68rem] font-bold text-[var(--brand-dark)]">
          {category.productCount ?? 0} listing{(category.productCount ?? 0) === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
