import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CircleDollarSign, Clock3, Megaphone } from "lucide-react";
import { AdvertExtensionActions } from "@/components/admin/advert-extension-actions";
import { BoostActions } from "@/components/admin/boost-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BadgeTone = "green" | "gold" | "red" | "blue" | "neutral";

export default async function AdminBoostsPage() {
  await requireRole(["ADMIN"]);
  const now = new Date();
  const requests = await prisma.productBoostRequest.findMany({
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          price: true,
          listingStatus: true,
          stockStatus: true,
          isFeatured: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
        },
      },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      seller: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <DashboardShell eyebrow="Admin" title="Homepage adverts" description="Review seller advert creative, confirm fee records, approve live campaigns, and handle extension requests." links={adminLinks}>
      <div className="mb-4 flex items-start gap-3 rounded-[8px] border border-cyan-200 bg-cyan-50 p-3 text-xs leading-5 text-cyan-950">
        <Megaphone className="mt-0.5 shrink-0" size={16} />
        Approved homepage adverts appear automatically on the buyer homepage until their expiry date.
      </div>
      <div className="grid gap-4">
        {requests.map((request) => {
          const media = request.images.length ? request.images : request.product.images;
          const expired = Boolean(request.endsAt && request.endsAt <= now);
          const statusTone: BadgeTone = request.status === "APPROVED" && !expired ? "green" : request.status === "REJECTED" ? "red" : request.status === "REQUESTED" ? "gold" : "neutral";
          const statusLabel = request.status === "APPROVED" && expired ? "Expired" : titleCase(request.status);

          return (
            <article key={request.id} className="app-panel app-panel-interactive overflow-hidden p-0">
              <div className="grid lg:grid-cols-[260px_1fr]">
                <Link href={`/products/${request.product.slug}`} className="relative block min-h-[210px] bg-[var(--surface-muted)]">
                  <Image
                    src={media[0]?.url ?? "/window.svg"}
                    alt={media[0]?.alt ?? request.product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </Link>
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${request.product.slug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand)]">{request.product.title}</Link>
                      <p className="mt-1 text-xs text-[var(--muted)]">{request.seller.name ?? request.seller.email} / {compactDate(request.createdAt)}</p>
                      {request.seller.phone ? <p className="mt-1 text-[0.68rem] text-[var(--muted)]">Seller phone: {request.seller.phone}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={request.paymentStatus === "CONFIRMED" || request.paymentStatus === "WAIVED" ? "blue" : "neutral"}>{titleCase(request.paymentStatus)}</Badge>
                      <Badge tone={statusTone}>{statusLabel}</Badge>
                      {request.extensionStatus === "REQUESTED" ? <Badge tone="gold">Extension requested</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[7px] bg-[var(--surface-muted)] p-3 sm:grid-cols-4">
                    <div><p className="text-[0.68rem] font-semibold text-[var(--muted)]">Campaign</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.headline || request.requestedFor || "Homepage product advert"}</p></div>
                    <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><CalendarDays size={12} /> Duration</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.durationDays} days</p></div>
                    <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><Clock3 size={12} /> Schedule</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.endsAt ? `ends ${compactDate(request.endsAt)}` : "Not started"}</p></div>
                    <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><CircleDollarSign size={12} /> Fee</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.paymentStatus === "WAIVED" ? "Waived" : request.feeAmount ? formatCurrency(Number(request.feeAmount)) : "Not set"}</p></div>
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

                  {request.note ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Note:</strong> {request.note}</p> : null}
                  {request.status === "REQUESTED" ? <BoostActions requestId={request.id} initialDays={request.durationDays} initialFee={request.feeAmount ? Number(request.feeAmount) : null} initialPaymentStatus={request.paymentStatus} initialReference={request.feeReference} /> : null}
                  {request.extensionStatus === "REQUESTED" ? <AdvertExtensionActions requestId={request.id} requestedDays={request.extensionDays} requestedNote={request.extensionNote} /> : null}
                </div>
              </div>
            </article>
          );
        })}
        {!requests.length ? <EmptyState title="No advert requests" description="Seller requests for homepage promotion will appear here." icon={Megaphone} /> : null}
      </div>
    </DashboardShell>
  );
}
