import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChefHat, Clock3, Flame, Leaf, MapPin, ShoppingBasket } from "lucide-react";
import type { PublicFoodItem } from "@/lib/food";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function FoodCard({
  item,
  priority = false,
}: {
  item: PublicFoodItem;
  priority?: boolean;
}) {
  const cover = item.images[0]?.url ?? item.imageUrl ?? "/window.svg";
  const estimate = Number(item.prepMinutes ?? 0) + Number(item.deliveryMinutes ?? 0);

  return (
    <article className="market-card group overflow-hidden rounded-[8px] border border-[var(--line)] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-xl">
      <Link href={`/food/${item.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[var(--surface-muted)]">
        <Image
          src={cover}
          alt={item.images[0]?.alt ?? item.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone="red"><ChefHat size={11} /> Food</Badge>
          {item.isSpicy ? <Badge tone="red"><Flame size={11} /> Spicy</Badge> : null}
          {item.isVegetarian ? <Badge tone="green"><Leaf size={11} /> Veg</Badge> : null}
        </div>
      </Link>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/food/${item.id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--ink)] transition group-hover:text-[var(--brand-dark)]">
              {item.name}
            </h3>
          </Link>
          <span className="whitespace-nowrap text-sm font-black text-[var(--brand-dark)]">
            {formatCurrency(item.basePrice)}
          </span>
        </div>
        {item.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-[var(--muted)]">
          <Link
            href={`/stores/${item.store.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)] bg-[var(--brand-dark)] px-2.5 py-1.5 font-black text-white shadow-sm shadow-blue-950/15 transition hover:-translate-y-px hover:bg-[var(--brand)]"
          >
            <ShoppingBasket size={14} />
            <span className="max-w-[150px] truncate">{item.store.name}</span>
            {item.store.isVerified ? <BadgeCheck className="text-emerald-300" size={14} /> : null}
          </Link>
          <span className="inline-flex items-center gap-1"><MapPin size={14} /> {item.store.area ?? item.store.location}</span>
          {estimate ? <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {estimate} mins</span> : null}
          {item.category ? <span>{item.category}</span> : null}
        </div>
      </div>
    </article>
  );
}

export function FoodRail({
  items,
  title,
  eyebrow = "Food",
  href,
}: {
  items: PublicFoodItem[];
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-[var(--ink)]">{title}</h2>
        </div>
        {href ? <Link href={href} className="text-xs font-bold text-[var(--brand-dark)]">See all</Link> : null}
      </div>
      <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
        {items.map((item) => (
          <div key={item.id} className="w-[244px] shrink-0 snap-start sm:w-[278px]">
            <FoodCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
