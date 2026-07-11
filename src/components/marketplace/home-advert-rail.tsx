"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, Megaphone, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicHomepageAdvert } from "@/lib/marketplace";
import { compactDate, formatCurrency } from "@/lib/utils";

export function HomeAdvertRail({ adverts }: { adverts: PublicHomepageAdvert[] }) {
  const [active, setActive] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const advert = adverts[active];

  const media = useMemo(() => {
    if (!advert) return [];
    const advertImages = advert.images?.length ? advert.images : advert.product.images;
    return advertImages.length ? advertImages : [{ url: "/window.svg", alt: advert.product.title }];
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

  const product = advert.product;

  function move(direction: -1 | 1) {
    setActive((current) => (current + direction + adverts.length) % adverts.length);
    setImageIndex(0);
  }

  return (
    <section className="border-b border-[var(--line)] bg-white py-5" aria-labelledby="home-adverts-title">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-cyan-700">
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

        <div className="grid overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#f8fbff] shadow-sm lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <Link href={`/products/${product.slug}`} className="group relative block min-h-[260px] overflow-hidden bg-[var(--surface-muted)] sm:min-h-[340px] lg:min-h-[420px]">
            <Image
              key={media[imageIndex]?.url}
              src={media[imageIndex]?.url ?? "/window.svg"}
              alt={media[imageIndex]?.alt ?? product.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 58vw, 100vw"
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-white sm:p-5">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.08em] backdrop-blur">
                <Megaphone size={12} /> Sponsored
              </p>
              <h3 className="mt-2 max-w-xl text-lg font-black leading-6 sm:text-xl">{advert.headline}</h3>
            </div>
          </Link>

          <div className="flex min-h-[320px] flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-cyan-700">Live campaign</p>
                <Link href={`/products/${product.slug}`} className="mt-1 block text-base font-black leading-6 text-[var(--ink)] hover:text-[var(--brand-dark)]">
                  {product.title}
                </Link>
              </div>
              <Link href={`/products/${product.slug}`} className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--brand-dark)] shadow-sm">
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <p className="mt-3 text-xl font-black text-[var(--brand-dark)]">{formatCurrency(product.price)}</p>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
              <p className="flex items-center gap-2"><MapPin size={14} /> {product.area ? `${product.area}, ${product.location}` : product.location}</p>
              <p className="flex items-center gap-2">
                {product.store?.isVerified ? <BadgeCheck className="text-cyan-700" size={14} /> : <span className="size-3 rounded-full bg-cyan-100" />}
                {product.store?.name ?? product.seller.name ?? "ShopLinkk seller"}
              </p>
              <p>Runs until {compactDate(advert.endsAt)}</p>
            </div>

            {media.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {media.slice(0, 4).map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-[7px] border bg-white transition ${imageIndex === index ? "border-[var(--brand)] ring-2 ring-blue-100" : "border-[var(--line)] hover:border-[var(--brand)]"}`}
                    aria-label={`Show advert photo ${index + 1}`}
                  >
                    <Image src={image.url} alt="" fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-auto pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {adverts.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActive(index);
                        setImageIndex(0);
                      }}
                      className={`h-2 rounded-full transition ${active === index ? "w-7 bg-[var(--brand)]" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
                      aria-label={`Show advert ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--brand-dark)] shadow-sm transition hover:-translate-y-px hover:border-[var(--brand)]" aria-label="Previous advert">
                    <ChevronLeft size={17} />
                  </button>
                  <button type="button" onClick={() => move(1)} className="grid size-9 place-items-center rounded-[8px] border border-[var(--line)] bg-white text-[var(--brand-dark)] shadow-sm transition hover:-translate-y-px hover:border-[var(--brand)]" aria-label="Next advert">
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[0.68rem] leading-5 text-[var(--muted)]">
                Sponsored seller advert. Inspect items, chat clearly, and meet safely before buying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
