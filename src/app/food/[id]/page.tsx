import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChefHat, Clock3, MapPin, ShoppingBasket, Store } from "lucide-react";
import { FoodOrderBuilder } from "@/components/food/food-order-builder";
import { ProductImageGallery } from "@/components/marketplace/product-image-gallery";
import { FoodRail } from "@/components/marketplace/food-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getPublicFoodItem, getPublicFoodItems } from "@/lib/food";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FoodItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublicFoodItem(id);
  if (!item) notFound();

  const related = (await getPublicFoodItems({
    category: item.category ?? undefined,
    location: item.store.location,
    take: 10,
  })).filter((food) => food.id !== item.id).slice(0, 8);
  const estimate = Number(item.prepMinutes ?? 0) + Number(item.deliveryMinutes ?? 0);
  const images = item.images.length
    ? item.images.map((image) => ({ url: image.url, alt: image.alt ?? item.name }))
    : [{ url: item.imageUrl ?? "/window.svg", alt: item.name }];

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4">
        <ButtonLink href="/marketplace?type=food" variant="secondary">
          <ArrowLeft size={16} />
          Browse food
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <ProductImageGallery title={item.name} images={images} />

        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-20">
          <div className="flex flex-wrap gap-2">
            <Badge tone="red"><ChefHat size={12} /> Food</Badge>
            {item.category ? <Badge tone="blue">{item.category}</Badge> : null}
            {item.store.isVerified ? <Badge tone="green"><BadgeCheck size={12} /> Verified seller</Badge> : null}
          </div>
          <h1 className="mt-4 text-xl font-black leading-tight text-[var(--ink)]">{item.name}</h1>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{formatCurrency(item.basePrice)}</p>
          {item.description ? <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.description}</p> : null}
          <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-2"><MapPin size={16} /> {item.store.area ? `${item.store.area}, ${item.store.location}` : item.store.location}</span>
            {estimate ? <span className="inline-flex items-center gap-2"><Clock3 size={16} /> About {estimate} minutes</span> : null}
            <Link href={`/stores/${item.store.slug}`} className="inline-flex items-center gap-2 font-black text-[var(--brand-dark)]">
              <Store size={16} />
              {item.store.name}
            </Link>
          </div>
          <div className="mt-5 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs leading-5 text-[var(--brand-dark)]">
            <ShoppingBasket className="mr-2 inline" size={15} />
            Add the food and add-ons to cart, then confirm the delivery address and send MoMo directly to the seller.
          </div>
        </aside>
      </div>

      <section className="mt-8">
        <FoodOrderBuilder item={item} store={item.store} />
      </section>

      {related.length ? (
        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <FoodRail items={related} title="Similar food nearby" eyebrow="More to order" href="/marketplace?type=food" />
        </section>
      ) : null}
    </div>
  );
}
