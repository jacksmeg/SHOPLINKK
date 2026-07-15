import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock3, ShoppingCart, Truck, Zap } from "lucide-react";
import { FlashSaleCountdown } from "@/components/marketplace/flash-sale-countdown";
import type { PublicProduct } from "@/lib/marketplace";
import { getActiveSalePrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

function discountPercent(price: number, salePrice: number) {
  if (!price || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function FlashSaleShowcase({ products, href = "/marketplace?sort=featured" }: { products: PublicProduct[]; href?: string }) {
  if (!products.length) return null;

  const firstEnd = products.find((product) => product.saleEndsAt)?.saleEndsAt;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="homepage-flash-sales">
      <div className="overflow-hidden rounded-[10px] bg-[#e60000] text-white shadow-2xl shadow-red-950/20">
        <div className="relative overflow-hidden border-b border-yellow-300/30 bg-[#e60000] px-4 py-5 sm:px-6">
          <div className="absolute -right-20 -top-24 size-72 rounded-full bg-yellow-300/90 blur-3xl" />
          <div className="absolute inset-y-0 right-0 hidden w-1/3 skew-x-[-18deg] bg-yellow-300 lg:block" />
          <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-yellow-300 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-950">
                <Zap size={13} /> Limited time only
              </p>
              <h2 id="homepage-flash-sales" className="mt-3 text-3xl font-black italic leading-none text-white drop-shadow sm:text-5xl">
                FLASH <span className="text-yellow-300">SALES</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm font-bold text-white/90">Unbeatable local deals from approved ShopLinkk sellers.</p>
            </div>
            <div className="rounded-[8px] bg-white p-3 text-center text-red-700 shadow-xl">
              <p className="flex items-center justify-center gap-1 text-[0.68rem] font-black uppercase tracking-[0.1em] text-slate-950">
                <Clock3 size={13} /> Offers end in
              </p>
              {firstEnd ? <div className="mt-2"><FlashSaleCountdown endsAt={firstEnd} /></div> : null}
            </div>
          </div>
        </div>

        <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 py-4 sm:px-6">
          {products.slice(0, 8).map((product) => {
            const salePrice = getActiveSalePrice(product);
            if (!salePrice) return null;
            const discount = discountPercent(product.price, salePrice);
            const cover = product.images[0]?.url ?? "/window.svg";

            return (
              <article key={product.id} className="w-[210px] shrink-0 overflow-hidden rounded-[10px] bg-white text-slate-950 shadow-xl sm:w-[238px]">
                <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-white">
                  <Image src={cover} alt={product.images[0]?.alt ?? product.title} fill className="object-contain p-3" unoptimized />
                  {discount ? (
                    <span className="absolute right-2 top-2 rounded-[6px] bg-red-600 px-2 py-1 text-xs font-black text-white">
                      -{discount}%
                    </span>
                  ) : null}
                </Link>
                <div className="p-3 text-center">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-black">{product.title}</h3>
                  <p className="mt-2 text-lg font-black text-red-600">{formatCurrency(salePrice)}</p>
                  <p className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.price)}</p>
                  <Link href={`/products/${product.slug}`} className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-yellow-300 px-4 text-xs font-black text-slate-950 transition hover:bg-yellow-200">
                    Shop now <ShoppingCart size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 bg-white px-4 py-3 text-slate-950 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap gap-4 text-xs font-black uppercase">
            <span className="inline-flex items-center gap-2"><Truck className="text-red-600" size={18} /> Fast local delivery</span>
            <span className="inline-flex items-center gap-2"><Zap className="text-red-600" size={18} /> Limited stock</span>
          </div>
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-black text-red-700">
            See all deals <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
