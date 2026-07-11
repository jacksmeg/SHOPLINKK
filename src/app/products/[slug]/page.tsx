import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Boxes, MapPin, MessageCircle, PackageCheck, Phone, Share2, ShieldAlert, ShieldCheck, Store, Tag, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ContactSellerButton } from "@/components/marketplace/contact-seller-button";
import { BlockUserButton } from "@/components/marketplace/block-user-button";
import { CompareButton } from "@/components/marketplace/compare-button";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { ProductImageGallery } from "@/components/marketplace/product-image-gallery";
import { ProductRail } from "@/components/marketplace/product-rail";
import { PriceAlertButton } from "@/components/marketplace/price-alert-button";
import { ReportButton } from "@/components/marketplace/report-button";
import { ReviewForm } from "@/components/marketplace/review-form";
import { getProductBySlug, getProductSeoBySlug, getRelatedProducts } from "@/lib/marketplace";
import { getCurrentSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { formatGhanaPhone, whatsappLink } from "@/lib/ghana";
import { formatCurrency, titleCase } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductSeoBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | ShopLinkk",
    };
  }

  const title = product.seoTitle || `${product.title} | ShopLinkk`;
  const description = product.seoDescription || product.description.slice(0, 155);
  const image = product.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [related, session] = await Promise.all([getRelatedProducts(product), getCurrentSession()]);
  if (session?.user?.id) {
    await Promise.all([
      prisma.recentlyViewed.upsert({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          userId: session.user.id,
          productId: product.id,
        },
      }),
      prisma.productView.create({
        data: {
          productId: product.id,
          userId: session.user.id,
          source: "product-page",
        },
      }),
    ]).catch(() => null);
  }
  const sellerPhone = product.store?.phone ?? product.seller.phone;
  const sellerWhatsapp = product.store?.whatsapp ?? product.seller.whatsapp ?? sellerPhone;
  const whatsappHref = product.allowWhatsapp
    ? whatsappLink(sellerWhatsapp, `Hello, I saw ${product.title} on ShopLinkk. Is it still available?`)
    : "";
  const productUrl = `${appUrl()}/products/${product.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seoDescription || product.description,
    image: product.images.map((image) => image.url),
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "GHS",
      availability: product.stockStatus === "SOLD" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: productUrl,
    },
    areaServed: product.area ? `${product.area}, ${product.location}` : product.location,
  };

  return (
    <div className="page-enter mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div>
          <ProductImageGallery title={product.title} images={product.images} />
        </div>

        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-20">
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{titleCase(String(product.stockStatus))}</Badge>
            {product.listingType === "SERVICE" ? <Badge tone="blue"><Wrench size={12} /> Service</Badge> : <Badge tone="blue">Product</Badge>}
            <Badge tone="neutral">{titleCase(String(product.condition))}</Badge>
            <Badge tone="blue">{product.category.name}</Badge>
            {product.negotiable ? <Badge tone="gold">Negotiable</Badge> : null}
          </div>
          <h1 className="mt-4 text-xl font-black leading-tight text-[var(--ink)]">{product.title}</h1>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{formatCurrency(product.price)}</p>
          <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-2"><MapPin size={16} /> {product.area ? `${product.area}, ${product.location}` : product.location}</span>
            <span className="inline-flex items-center gap-2"><Tag size={16} /> {product.category.name}</span>
            <span className="inline-flex items-center gap-2"><PackageCheck size={16} /> {titleCase(String(product.stockStatus))}</span>
            {typeof product.quantity === "number" && product.listingType !== "SERVICE" ? (
              <span className="inline-flex items-center gap-2"><Boxes size={16} /> {product.quantity} unit{product.quantity === 1 ? "" : "s"} left</span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <ContactSellerButton productId={product.id} sellerId={product.seller.id} />
            {whatsappHref ? (
              <ButtonLink href={whatsappHref} target="_blank" rel="noreferrer" variant="secondary">
                <MessageCircle size={17} />
                WhatsApp
              </ButtonLink>
            ) : null}
            {product.allowCalls && sellerPhone ? (
              <ButtonLink href={`tel:${formatGhanaPhone(sellerPhone)}`} variant="secondary">
                <Phone size={17} />
                Call
              </ButtonLink>
            ) : null}
            <FavoriteButton productId={product.id} />
            <CompareButton productId={product.id} />
            <PriceAlertButton productId={product.id} currentPrice={product.price} />
            <ReportButton productId={product.id} reportedUserId={product.seller.id} />
            <BlockUserButton userId={product.seller.id} />
            <ButtonLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`} target="_blank" rel="noreferrer" variant="ghost">
              <Share2 size={17} />
              Share
            </ButtonLink>
          </div>

          <div className="mt-5 rounded-[8px] bg-[var(--brand-soft)] p-3.5">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 text-[var(--brand)]" size={20} />
              <p className="text-xs leading-5 text-[var(--brand-dark)]">
                ShopLinkk does not process payments yet. Chat with the seller, inspect the item, and agree safely before paying.
              </p>
            </div>
          </div>

          {product.pickupNote ? (
            <div className="mt-4 rounded-[8px] border border-cyan-200 bg-[var(--gold-soft)] p-3.5 text-xs leading-5 text-cyan-950">
              <strong>Pickup/delivery note:</strong> {product.pickupNote}
            </div>
          ) : null}

          {product.store ? (
            <Link
              href={`/stores/${product.store.slug}`}
              className="mt-5 flex items-center gap-3 rounded-[8px] border border-[var(--line)] p-3.5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              <span className="grid size-10 place-items-center rounded-[7px] bg-[var(--brand)] text-white">
                <Store size={18} />
              </span>
              <span>
                <span className="flex items-center gap-2 text-sm font-black text-[var(--ink)]">
                  {product.store.name}
                  {product.store.isVerified ? <ShieldCheck className="text-[var(--brand)]" size={16} /> : null}
                </span>
                <span className="text-xs text-[var(--muted)]">View seller store</span>
                <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">
                  Trust {product.store.trustScore ?? 50}% · {product.store.ratingCount ?? 0} review{product.store.ratingCount === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          ) : null}
        </aside>
      </div>

      <section className="mt-8 border-t border-[var(--line)] pt-6">
        <h2 className="text-lg font-black text-[var(--ink)]">Product details</h2>
        <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{product.description}</p>
      </section>

      {product.videoUrl ? (
        <section className="mt-6 border-t border-[var(--line)] pt-6">
          <h2 className="text-lg font-black text-[var(--ink)]">Product video</h2>
          {product.videoUrl.includes("/uploads/") || product.videoUrl.includes("cloudinary.com") ? (
            <video controls preload="metadata" playsInline src={product.videoUrl} className="mt-4 aspect-video w-full rounded-[8px] bg-black object-contain" aria-label={`${product.title} product video`} />
          ) : (
            <ButtonLink href={product.videoUrl} target="_blank" rel="noreferrer" variant="secondary" className="mt-4">
              Open product video
            </ButtonLink>
          )}
        </section>
      ) : null}

      {session?.user.id && session.user.id !== product.seller.id ? (
        <section className="mt-8 border-t border-[var(--line)] pt-6">
          <ReviewForm sellerId={product.seller.id} storeId={product.store?.id} productId={product.id} />
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <ProductRail products={related} eyebrow="Related" title="Similar products" href={`/marketplace?category=${product.category.slug}`} />
        </section>
      ) : null}
    </div>
  );
}
