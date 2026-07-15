"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  MessageCircle,
  PhoneCall,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FlashSaleCountdown } from "@/components/marketplace/flash-sale-countdown";
import type { PublicCategory, PublicHomepageAdvert, PublicProduct } from "@/lib/marketplace";
import { compactDate, formatCurrency } from "@/lib/utils";

export function HomeAdvertRail({
  adverts,
  categories = [],
  flashSales = [],
}: {
  adverts: PublicHomepageAdvert[];
  categories?: PublicCategory[];
  flashSales?: PublicProduct[];
}) {
  const [active, setActive] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const advert = adverts[active];

  const media = useMemo(() => {
    if (!advert) return [];
    const advertImages = advert.images?.length ? advert.images : (advert.product?.images ?? []);
    return advertImages.length ? advertImages : [{ url: "/window.svg", alt: advert.headline ?? advert.product?.title ?? "ShopLinkk advert" }];
  }, [advert]);

  useEffect(() => {
    if (adverts.length <= 1) return;
    const timeout = window.setInterval(() => {
      setActive((current) => (current + 1) % adverts.length);
      setImageIndex(0);
    }, 6500);
    return () => window.clearInterval(timeout);
  }, [adverts.length]);

  useEffect(() => {
    if (media.length <= 1) return;
    const timeout = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % media.length);
    }, 4200);
    return () => window.clearInterval(timeout);
  }, [media.length]);

  if (!advert) return null;

  const product = advert.product ?? null;
  const advertHref = advert.href || (product ? `/products/${product.slug}` : "/marketplace");
  const advertTitle = advert.headline || product?.title || "ShopLinkk advert";
  const sellerLabel = advert.subline || product?.store?.name || product?.seller.name || "ShopLinkk";
  const priceLine = product ? `${formatCurrency(product.price)} - runs until ${compactDate(advert.endsAt)}` : `Runs until ${compactDate(advert.endsAt)}`;
  const flashEnd = flashSales.find((item) => item.saleEndsAt)?.saleEndsAt;

  function move(direction: -1 | 1) {
    setActive((current) => (current + direction + adverts.length) % adverts.length);
    setImageIndex(0);
  }

  function moveImage(direction: -1 | 1) {
    if (media.length <= 1) return;
    setImageIndex((current) => (current + direction + media.length) % media.length);
  }

  return (
    <section className="border-b border-[var(--line)] bg-[var(--surface-muted)] py-5" aria-labelledby="home-adverts-title">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
              <Megaphone size={13} /> Seller adverts
            </p>
            <h2 id="home-adverts-title" className="mt-1 text-base font-black text-[var(--ink)]">
              Promoted around your community
            </h2>
          </div>
          <Link href="/marketplace?sort=featured" className="hidden text-xs font-bold text-[var(--brand-dark)] sm:inline">
            View featured
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          <aside className="hidden rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-sm lg:block">
            <p className="mb-2 px-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--brand)]">Shop by category</p>
            <div className="grid gap-1">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/marketplace?category=${category.slug}`}
                  className="group flex min-h-9 items-center gap-2 rounded-[7px] px-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--brand)] hover:text-white"
                >
                  <Tag size={14} className="text-[var(--brand)] transition group-hover:text-white" />
                  <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  <span className="text-[0.65rem] text-[var(--muted)] transition group-hover:text-white/75">{category.productCount ?? 0}</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="uiverse-depth-card group relative min-h-[280px] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--brand-dark)] shadow-lg sm:min-h-[360px] lg:min-h-[430px]">
            <Image
              key={media[imageIndex]?.url}
              src={media[imageIndex]?.url ?? "/window.svg"}
              alt={media[imageIndex]?.alt ?? advertTitle}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.025]"
              sizes="(min-width: 1024px) 54vw, 100vw"
              unoptimized
            />
            <Link href={advertHref} className="absolute inset-0 z-[1]" aria-label={`View ${advertTitle}`} />
            <div className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/78 via-black/30 to-transparent p-4 text-white sm:p-5">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.08em] shadow-sm">
                <Megaphone size={12} /> Sponsored
              </p>
              <h3 className="mt-2 max-w-2xl text-lg font-black leading-6 sm:text-2xl">{advertTitle}</h3>
              <p className="mt-1 text-xs font-semibold text-white/78">{priceLine}</p>
            </div>

            {media.length > 1 ? (
              <div className="absolute inset-x-3 top-1/2 z-[3] flex -translate-y-1/2 items-center justify-between">
                <button type="button" onClick={() => moveImage(-1)} className="grid size-10 place-items-center rounded-full bg-white/95 text-[var(--brand-dark)] shadow-lg transition hover:scale-105" aria-label="Previous advert image">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={() => moveImage(1)} className="grid size-10 place-items-center rounded-full bg-white/95 text-[var(--brand-dark)] shadow-lg transition hover:scale-105" aria-label="Next advert image">
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : null}

            <div className="absolute bottom-4 right-4 z-[3] flex items-center gap-1.5">
              {media.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  className={`size-2 rounded-full transition ${imageIndex === index ? "w-7 bg-white" : "bg-white/45 hover:bg-white/80"}`}
                  aria-label={`Show advert photo ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <aside className="grid gap-3">
            <Link href="/contact" className="uiverse-depth-card flex items-center gap-3 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
              <span className="grid size-11 place-items-center rounded-full bg-green-600 text-white"><PhoneCall size={20} /></span>
              <span>
                <span className="block text-sm font-black text-[var(--ink)]">Call / WhatsApp</span>
                <span className="text-xs font-bold text-[var(--muted)]">0549896901</span>
              </span>
            </Link>
            <Link href="/sell-on-shoplinkk" className="uiverse-depth-card flex items-center gap-3 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
              <span className="grid size-11 place-items-center rounded-full bg-[var(--brand)] text-white"><Store size={20} /></span>
              <span>
                <span className="block text-sm font-black text-[var(--ink)]">Sell on ShopLinkk</span>
                <span className="text-xs font-bold text-[var(--muted)]">Reach local buyers</span>
              </span>
            </Link>
            <Link href="/buyer/orders" className="uiverse-depth-card flex items-center gap-3 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
              <span className="grid size-11 place-items-center rounded-full bg-purple-700 text-white"><Truck size={20} /></span>
              <span>
                <span className="block text-sm font-black text-[var(--ink)]">Track orders</span>
                <span className="text-xs font-bold text-[var(--muted)]">Food and deliveries</span>
              </span>
            </Link>
            <Link href={advertHref} className="uiverse-depth-card relative min-h-[150px] overflow-hidden rounded-[8px] border border-[var(--line)] bg-red-600 p-4 text-white shadow-sm">
              <ShoppingBag size={24} />
              <p className="mt-4 text-xl font-black leading-6">{advert.kind === "ADMIN" ? "Official advert" : "Sponsored deal"}</p>
              <p className="mt-1 text-xs font-bold text-white/80">{sellerLabel}</p>
              <ArrowUpRight className="absolute right-4 top-4" size={18} />
            </Link>
          </aside>
        </div>

        <div className="mt-3 overflow-hidden rounded-[8px] bg-red-700 text-white shadow-sm">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-[7px] bg-yellow-400 text-slate-950">
                <Zap size={18} />
              </span>
              <div>
                <p className="text-base font-black">Flash Sales</p>
                <p className="text-xs font-semibold text-white/75">{flashSales.length || 0} live offers near you</p>
              </div>
            </div>
            {flashEnd ? (
              <div className="text-center">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white/70">Time left</p>
                <FlashSaleCountdown endsAt={flashEnd} />
              </div>
            ) : null}
            <Link href="/marketplace?sort=featured" className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-white px-4 py-2 text-xs font-black text-red-700">
              See all
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--brand-dark)] shadow-sm transition hover:-translate-y-px hover:border-[var(--brand)]" aria-label="Previous advert">
            <ChevronLeft size={17} />
          </button>
          {adverts.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActive(index);
                setImageIndex(0);
              }}
              className={`h-2 rounded-full transition ${active === index ? "w-7 bg-[var(--brand)]" : "w-2 bg-slate-400 hover:bg-slate-500"}`}
              aria-label={`Show advert ${index + 1}`}
            />
          ))}
          <button type="button" onClick={() => move(1)} className="grid size-9 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--brand-dark)] shadow-sm transition hover:-translate-y-px hover:border-[var(--brand)]" aria-label="Next advert">
            <ChevronRight size={17} />
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.68rem] leading-5 text-[var(--muted)]">
          {product?.store?.isVerified ? <BadgeCheck className="text-green-600" size={14} /> : <MessageCircle size={14} />}
          {advert.kind === "ADMIN" ? "Official ShopLinkk advert. Tap the image to view the linked page." : "Sponsored seller advert. Inspect items, chat clearly, and meet safely before buying."}
        </p>
      </div>
    </section>
  );
}
