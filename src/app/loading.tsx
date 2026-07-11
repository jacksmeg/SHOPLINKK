import { ProductCardSkeleton } from "@/components/marketplace/product-card";
import { ShopLinkkLoader } from "@/components/ui/shoplinkk-loader";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ShopLinkkLoader label="Loading local marketplace" />
      <div className="h-8 w-56 animate-pulse rounded bg-blue-50" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-zinc-100" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
