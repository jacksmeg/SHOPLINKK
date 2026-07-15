import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, Megaphone, PlusCircle } from "lucide-react";
import { AdvertManageActions } from "@/components/seller/advert-manage-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerAdvertsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const now = new Date();
  const [store, adverts] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id }, select: { kind: true } }),
    prisma.productBoostRequest.findMany({
      where: session.user.role === "ADMIN" ? {} : { sellerId: session.user.id },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            price: true,
            listingStatus: true,
            stockStatus: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
          },
        },
        images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const live = adverts.filter((advert) => advert.status === "APPROVED" && advert.endsAt && advert.endsAt > now).length;
  const pending = adverts.filter((advert) => advert.status === "REQUESTED").length;
  const expired = adverts.filter((advert) => advert.endsAt && advert.endsAt <= now).length;

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Advert management"
      description="Track homepage advert requests, approved campaigns, creative images, fees, and extension requests."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="app-panel p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Live adverts</p><p className="mt-2 text-2xl font-black text-[var(--brand-dark)]">{live}</p></div>
        <div className="app-panel p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Waiting review</p><p className="mt-2 text-2xl font-black text-cyan-700">{pending}</p></div>
        <div className="app-panel p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Expired</p><p className="mt-2 text-2xl font-black text-slate-700">{expired}</p></div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-5 text-[var(--muted)]">Choose any approved product and request an advert. Admin approval makes it appear automatically on the homepage advert showcase.</p>
        <ButtonLink href={store?.kind === "FOOD" ? "/seller/food/menu" : "/seller"} variant="secondary"><PlusCircle size={15} /> Choose item</ButtonLink>
      </div>

      <div className="grid gap-4">
        {adverts.map((advert) => {
          const media = advert.images.length ? advert.images : advert.product.images;
          const isExpired = Boolean(advert.endsAt && advert.endsAt <= now);
          const statusTone = advert.status === "APPROVED" && !isExpired ? "green" : advert.status === "REJECTED" ? "red" : advert.status === "REQUESTED" ? "gold" : "neutral";
          const statusLabel = advert.status === "APPROVED" && isExpired ? "Expired" : titleCase(advert.status);

          return (
            <article key={advert.id} className="app-panel app-panel-interactive overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                <Link href={`/products/${advert.product.slug}`} className="relative block min-h-[210px] bg-[var(--surface-muted)]">
                  <Image
                    src={media[0]?.url ?? "/window.svg"}
                    alt={media[0]?.alt ?? advert.product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </Link>
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${advert.product.slug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{advert.product.title}</Link>
                      <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(advert.product.price))}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone}>{statusLabel}</Badge>
                      <Badge tone={advert.paymentStatus === "CONFIRMED" || advert.paymentStatus === "WAIVED" ? "blue" : "neutral"}>{titleCase(advert.paymentStatus)}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[7px] bg-[var(--surface-muted)] p-3 sm:grid-cols-3">
                    <div><p className="text-[0.68rem] font-semibold text-[var(--muted)]">Headline</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{advert.headline || "Homepage product advert"}</p></div>
                    <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><CalendarDays size={12} /> Duration</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{advert.durationDays} days</p></div>
                    <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><Clock3 size={12} /> Ends</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{advert.endsAt ? compactDate(advert.endsAt) : "Not started"}</p></div>
                  </div>

                  {media.length ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {media.slice(0, 8).map((image, index) => (
                        <span key={`${image.url}-${index}`} className="relative block size-14 shrink-0 overflow-hidden rounded-[7px] border border-[var(--line)] bg-white">
                          <Image src={image.url} alt="" fill className="object-cover" unoptimized />
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {advert.note ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Note:</strong> {advert.note}</p> : null}
                  {advert.extensionNote ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Extension note:</strong> {advert.extensionNote}</p> : null}

                  <AdvertManageActions requestId={advert.id} status={isExpired ? "ENDED" : advert.status} extensionStatus={advert.extensionStatus} />
                </div>
              </div>
            </article>
          );
        })}
        {!adverts.length ? <EmptyState title="No advert requests yet" description="Advert requests you send for your products will appear here." icon={Megaphone} /> : null}
      </div>
    </DashboardShell>
  );
}
