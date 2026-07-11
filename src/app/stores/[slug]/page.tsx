import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, Phone, ShieldCheck, Star, Store } from "lucide-react";
import { ProductCard } from "@/components/marketplace/product-card";
import { BlockUserButton } from "@/components/marketplace/block-user-button";
import { ReportButton } from "@/components/marketplace/report-button";
import { ReviewForm } from "@/components/marketplace/review-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { whatsappLink } from "@/lib/ghana";
import { getStoreBySlug } from "@/lib/marketplace";
import { compactDate } from "@/lib/utils";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const [session, reviews] = await Promise.all([
    getCurrentSession(),
    prisma.review.findMany({
      where: { storeId: store.id },
      include: { author: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []),
  ]);
  const whatsappHref = whatsappLink(store.whatsapp ?? store.phone, `Hello, I saw ${store.name} on ShopLinkk.`);

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white">
        <div className="relative h-40 bg-[var(--surface-muted)] sm:h-56">
          {store.coverUrl ? (
            <Image src={store.coverUrl} alt={store.name} fill className="object-cover" unoptimized />
          ) : null}
        </div>
        <div className="p-4 sm:p-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative grid size-20 place-items-center overflow-hidden rounded-[8px] border-4 border-white bg-[var(--brand)] text-white shadow-lg sm:size-24">
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" unoptimized />
                ) : (
                  <Store size={34} />
                )}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--ink)]">{store.name}</h1>
                  {store.isVerified ? <Badge tone="green"><ShieldCheck size={13} /> Verified</Badge> : null}
                  <Badge tone="gold"><Star size={13} /> {store.ratingAverage?.toFixed(1) ?? "0.0"}</Badge>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1"><MapPin size={16} /> {store.area ? `${store.area}, ${store.location}` : store.location}</span>
                  {store.phone ? <span className="inline-flex items-center gap-1"><Phone size={16} /> {store.phone}</span> : null}
                  {store.openingHours ? <span className="inline-flex items-center gap-1"><Clock size={16} /> {store.openingHours}</span> : null}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {whatsappHref ? (
                <ButtonLink href={whatsappHref} target="_blank" rel="noreferrer" variant="secondary">
                  <MessageCircle size={16} />
                  WhatsApp
                </ButtonLink>
              ) : null}
              <ReportButton reportedUserId={store.owner.id} />
              <BlockUserButton userId={store.owner.id} />
            </div>
          </div>
          {store.description ? (
            <p className="mt-5 max-w-3xl text-xs leading-5 text-[var(--muted)]">{store.description}</p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] bg-[var(--brand-soft)] p-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Trust score</p>
              <p className="mt-1 text-lg font-black text-[var(--brand-dark)]">{store.trustScore ?? 50}%</p>
            </div>
            <div className="rounded-[8px] bg-[var(--gold-soft)] p-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-800">Reviews</p>
              <p className="mt-1 text-lg font-black text-cyan-950">{store.ratingCount ?? 0}</p>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">Address</p>
              <p className="mt-1 text-sm font-bold text-[var(--brand-dark)]">{store.address || "Ask seller in chat"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[8px] border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Seller reviews</h2>
          <div className="mt-4 grid gap-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-[var(--ink)]">{review.author.name ?? "ShopLinkk buyer"}</p>
                  <span className="text-xs text-[var(--muted)]">{compactDate(review.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[var(--brand-dark)]">{review.rating} stars</p>
                {review.comment ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{review.comment}</p> : null}
              </article>
            ))}
            {!reviews.length ? <p className="text-sm text-[var(--muted)]">No reviews yet.</p> : null}
          </div>
        </div>
        {session?.user?.id && session.user.id !== store.owner.id ? (
          <ReviewForm sellerId={store.owner.id} storeId={store.id} />
        ) : (
          <div className="rounded-[8px] border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-sm">
            <Link href="/login" className="font-black text-[var(--brand-dark)]">Log in</Link> to review this seller after dealing with them.
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Store listings</p>
          <h2 className="mt-1 text-lg font-black text-[var(--ink)]">Products from {store.name}</h2>
        </div>
        {store.products?.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {store.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No public products yet"
            description="This seller does not have approved listings available right now."
          />
        )}
      </section>
    </div>
  );
}
