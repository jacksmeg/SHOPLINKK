import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Megaphone, MapPin } from "lucide-react";
import type { PublicHomepageAdvert } from "@/lib/marketplace";
import { formatCurrency } from "@/lib/utils";

function AdvertCard({ advert, clone = false }: { advert: PublicHomepageAdvert; clone?: boolean }) {
  const product = advert.product;
  return (
    <Link
      href={`/products/${product.slug}`}
      tabIndex={clone ? -1 : undefined}
      className="advert-card group relative grid w-[280px] shrink-0 grid-cols-[88px_1fr] gap-3 overflow-hidden rounded-[8px] border border-[var(--line)] bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-xl sm:w-[360px] sm:grid-cols-[112px_1fr]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
        <Image src={product.images[0]?.url ?? "/window.svg"} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
      </div>
      <div className="min-w-0 py-0.5">
        <p className="flex items-center gap-1 text-[0.64rem] font-bold uppercase tracking-[0.08em] text-cyan-700"><Megaphone size={11} /> Sponsored</p>
        <h3 className="mt-1 line-clamp-2 text-xs font-black leading-5 text-[var(--ink)]">{advert.headline}</h3>
        <p className="mt-1 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(product.price)}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-[0.68rem] text-[var(--muted)]"><MapPin size={11} /> {product.area ? `${product.area}, ${product.location}` : product.location}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-[0.68rem] font-semibold text-[var(--muted)]">{product.store?.isVerified ? <BadgeCheck className="text-cyan-700" size={12} /> : null}{product.store?.name ?? product.seller.name ?? "ShopLinkk seller"}</p>
      </div>
      <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-[7px] bg-white/95 text-[var(--brand)] shadow-sm"><ArrowUpRight size={14} /></span>
    </Link>
  );
}

export function HomeAdvertRail({ adverts }: { adverts: PublicHomepageAdvert[] }) {
  if (!adverts.length) {
    return (
      <section className="overflow-hidden border-b border-[var(--line)] bg-[#f7fbff] py-6" aria-labelledby="home-adverts-title">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-cyan-700">
                <Megaphone size={13} /> Seller adverts
              </p>
              <h2 id="home-adverts-title" className="mt-1 text-base font-black text-[var(--ink)]">Homepage advert slots are ready</h2>
            </div>
            <Link href="/seller" className="text-xs font-bold text-[var(--brand-dark)]">Request advert</Link>
          </div>
        </div>
        <div className="advert-viewport">
          <div className="advert-track">
            {[0, 1].map((group) => (
              <div key={group} className="flex gap-3 px-1 sm:gap-4" aria-hidden={group === 1}>
                {["Admin controlled", "Seller paid slot", "Homepage promotion", "Local campaign"].map((title) => (
                  <div key={`${group}-${title}`} className="grid w-[280px] shrink-0 grid-cols-[72px_1fr] gap-3 rounded-[8px] border border-dashed border-cyan-200 bg-white p-3 shadow-sm sm:w-[360px]">
                    <span className="grid aspect-square place-items-center rounded-[7px] bg-cyan-50 text-cyan-800">
                      <Megaphone size={24} />
                    </span>
                    <span className="min-w-0 py-0.5">
                      <span className="block text-[0.64rem] font-bold uppercase tracking-[0.08em] text-cyan-700">Available slot</span>
                      <span className="mt-1 block text-xs font-black leading-5 text-[var(--ink)]">{title}</span>
                      <span className="mt-1 block text-[0.68rem] leading-5 text-[var(--muted)]">Approved seller campaigns will run here after admin confirms the offline fee.</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const base = adverts.length >= 4 ? adverts : Array.from({ length: Math.ceil(4 / adverts.length) }, () => adverts).flat();

  return (
    <section className="overflow-hidden border-b border-[var(--line)] bg-[#f7fbff] py-6" aria-labelledby="home-adverts-title">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div><p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-cyan-700"><Megaphone size={13} /> Seller adverts</p><h2 id="home-adverts-title" className="mt-1 text-base font-black text-[var(--ink)]">Promoted around your community</h2></div>
          <Link href="/marketplace?sort=featured" className="text-xs font-bold text-[var(--brand-dark)]">View featured</Link>
        </div>
      </div>
      <div className="advert-viewport">
        <div className="advert-track">
          <div className="flex gap-3 px-1 sm:gap-4">{base.map((advert, index) => <AdvertCard key={`${advert.id}-a-${index}`} advert={advert} />)}</div>
          <div className="flex gap-3 px-1 sm:gap-4" aria-hidden="true">{base.map((advert, index) => <AdvertCard key={`${advert.id}-b-${index}`} advert={advert} clone />)}</div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[1440px] px-4 text-[0.64rem] text-[var(--muted)] sm:px-6 lg:px-8">Paid placement. ShopLinkk does not guarantee products or process purchases. Inspect before paying.</p>
    </section>
  );
}
