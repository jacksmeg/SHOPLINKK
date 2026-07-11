import Link from "next/link";
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

export function CategoryTile({ category }: { category: PublicCategory }) {
  return (
    <Link
      href={`/marketplace?category=${category.slug}`}
      className="group rounded-[8px] border border-[var(--line)] bg-white p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-lg sm:p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`category-icon-shell ${categoryTones[category.slug] ?? "category-tone-blue"}`}>
          <CategoryIcon name={category.icon} />
        </div>
        <ArrowRight className="text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--brand)]" size={18} />
      </div>
      <h3 className="mt-3 text-sm font-black text-[var(--ink)]">{category.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
        {category.description}
      </p>
    </Link>
  );
}
