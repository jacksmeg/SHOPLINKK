import { CategoryTile } from "@/components/marketplace/category-tile";
import { getCategories } from "@/lib/marketplace";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Categories</p>
        <h1 className="mt-1 text-xl font-black text-[var(--ink)]">Find what the town is selling</h1>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          ShopLinkk starts with the practical categories people in Dunkwa-on-Offin already trade every day.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryTile key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}
