import Image from "next/image";
import Link from "next/link";
import { Boxes, Flame, MapPin, ShieldCheck, Store, Video, Wrench } from "lucide-react";
import type { PublicProduct } from "@/lib/marketplace";
import { getActiveSalePrice, saleEndsInLabel } from "@/lib/pricing";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/marketplace/favorite-button";

export function ProductCard({
  product,
  priority = false,
}: {
  product: PublicProduct;
  priority?: boolean;
}) {
  const cover = product.images[0]?.url ?? "/window.svg";
  const salePrice = getActiveSalePrice(product);
  const saleLabel = saleEndsInLabel(product.saleEndsAt);

  return (
    <article className="market-card group overflow-hidden rounded-[8px] border border-[var(--line)] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[var(--surface-muted)]">
        <Image
          src={cover}
          alt={product.images[0]?.alt ?? product.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {salePrice ? <Badge tone="red"><Flame size={11} /> Flash sale</Badge> : null}
          {product.listingType === "SERVICE" ? <Badge tone="blue"><Wrench size={11} /> Service</Badge> : null}
          {product.isFeatured ? <Badge tone="gold">Featured</Badge> : null}
          {product.negotiable ? <Badge tone="blue">Negotiable</Badge> : null}
          {product.videoUrl ? <Badge tone="blue"><Video size={11} /> Video</Badge> : null}
          <Badge tone={product.condition === "NEW" ? "green" : "neutral"}>
            {titleCase(String(product.condition))}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <FavoriteButton productId={product.id} compact />
        </div>
      </Link>

      <div className="p-3.5">
        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:justify-between sm:gap-3">
          <Link href={`/products/${product.slug}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--ink)] transition group-hover:text-[var(--brand-dark)]">
              {product.title}
            </h3>
          </Link>
          <span className="whitespace-nowrap text-left text-sm font-black text-[var(--brand-dark)] sm:text-right">
            {salePrice ? (
              <>
                <span className="block text-red-600">{formatCurrency(salePrice)}</span>
                <span className="block text-[0.68rem] font-bold text-[var(--muted)] line-through">{formatCurrency(product.price)}</span>
              </>
            ) : (
              formatCurrency(product.price)
            )}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
          {product.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={15} />
            {product.area ? `${product.area}, ${product.location}` : product.location}
          </span>
          {product.store ? (
            <Link
              href={`/stores/${product.store.slug}`}
              className="inline-flex items-center gap-1 text-[var(--brand-dark)]"
            >
              <Store size={15} />
              {product.store.name}
              {product.store.isVerified ? <ShieldCheck size={14} /> : null}
            </Link>
          ) : null}
          {product.store?.trustScore ? <span>Trust {product.store.trustScore}%</span> : null}
          {typeof product.quantity === "number" && product.listingType !== "SERVICE" ? (
            <span className="inline-flex items-center gap-1">
              <Boxes size={14} />
              {product.quantity} unit{product.quantity === 1 ? "" : "s"} left
            </span>
          ) : null}
          {salePrice && saleLabel ? <span className="font-black text-red-600">{saleLabel}</span> : null}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-blue-50" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="h-8 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}
