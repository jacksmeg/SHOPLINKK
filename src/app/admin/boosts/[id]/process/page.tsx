import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Megaphone, PackageCheck, ReceiptText, Store } from "lucide-react";
import { BoostActions } from "@/components/admin/boost-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAdvertProcessPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const [request, packages] = await Promise.all([
    prisma.productBoostRequest.findUnique({
      where: { id },
      include: {
        seller: { select: { name: true, email: true, phone: true } },
        billingPackage: true,
        paymentTransactions: { orderBy: { createdAt: "desc" }, take: 5 },
        images: { orderBy: { sortOrder: "asc" } },
        product: {
          include: {
            store: { select: { name: true, slug: true, phone: true, momoNumber: true } },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
        },
      },
    }),
    prisma.billingPackage.findMany({
      where: { type: "ADVERT", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    }),
  ]);

  return (
    <DashboardShell eyebrow="Admin" title="Process advert" description="Review creative, package, billing status, and campaign timing before showing the advert on ShopLinkk." links={adminLinks}>
      <Link href="/admin/boosts" className="mb-4 inline-flex items-center gap-2 text-xs font-black text-[var(--brand-dark)] hover:underline">
        <ArrowLeft size={14} />
        Back to adverts
      </Link>

      {!request ? (
        <EmptyState title="Advert not found" description="This advert request may have been removed." icon={Megaphone} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-4">
            <article className="app-panel overflow-hidden p-0">
              <div className="relative min-h-[280px] bg-[var(--surface-muted)]">
                <Image src={request.images[0]?.url ?? request.product.images[0]?.url ?? "/window.svg"} alt={request.headline || request.product.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-white/75">Homepage campaign</p>
                  <h2 className="mt-1 text-xl font-black">{request.headline || request.product.title}</h2>
                  <p className="mt-1 text-xs text-white/80">Requested {compactDate(request.createdAt)}</p>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "red" : "gold"}>{titleCase(request.status)}</Badge>
                  <Badge tone={request.paymentStatus === "CONFIRMED" || request.paymentStatus === "WAIVED" ? "blue" : "neutral"}>{titleCase(request.paymentStatus)}</Badge>
                  <Badge tone="neutral">{titleCase(request.placement)}</Badge>
                </div>
                <div className="mt-4 grid gap-3 rounded-[8px] bg-[var(--surface-muted)] p-3 sm:grid-cols-3">
                  <div><p className="text-[0.68rem] font-bold text-[var(--muted)]">Product</p><Link href={`/products/${request.product.slug}`} className="mt-1 block text-xs font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{request.product.title}</Link></div>
                  <div><p className="text-[0.68rem] font-bold text-[var(--muted)]">Seller</p><p className="mt-1 text-xs font-black text-[var(--ink)]">{request.seller.name || request.seller.email || "Seller"}</p></div>
                  <div><p className="text-[0.68rem] font-bold text-[var(--muted)]">Store</p><p className="mt-1 text-xs font-black text-[var(--ink)]">{request.product.store?.name || "No store"}</p></div>
                </div>
                {request.status === "REQUESTED" ? (
                  <BoostActions
                    requestId={request.id}
                    initialDays={request.billingPackage?.durationDays ?? request.durationDays}
                    initialFee={request.billingPackage ? Number(request.billingPackage.price) : request.feeAmount ? Number(request.feeAmount) : null}
                    initialPaymentStatus={request.paymentStatus}
                    initialReference={request.feeReference}
                  />
                ) : (
                  <p className="mt-4 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-semibold text-[var(--brand-dark)]">
                    This advert has already been reviewed. Create a new seller request for a fresh campaign.
                  </p>
                )}
              </div>
            </article>
          </section>

          <aside className="grid gap-4 self-start lg:sticky lg:top-20">
            <div className="app-panel p-4">
              <div className="flex items-center gap-2">
                <CreditCard size={17} className="text-[var(--brand)]" />
                <h2 className="text-sm font-black text-[var(--ink)]">Billing decision</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                Use the form to quote a fee, confirm an offline payment/reference, waive the fee, or run the advert after payment.
              </p>
              <div className="mt-3 rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs">
                <p className="font-black text-[var(--ink)]">Current fee</p>
                <p className="mt-1 text-lg font-black text-[var(--brand-dark)]">{request.feeAmount ? formatCurrency(Number(request.feeAmount)) : "Not set"}</p>
              </div>
            </div>

            <div className="app-panel p-4">
              <div className="flex items-center gap-2">
                <PackageCheck size={17} className="text-[var(--brand)]" />
                <h2 className="text-sm font-black text-[var(--ink)]">Active advert packages</h2>
              </div>
              <div className="mt-3 grid gap-2">
                {packages.map((item) => (
                  <div key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                    <p className="text-xs font-black text-[var(--ink)]">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatCurrency(Number(item.price))}{item.durationDays ? ` / ${item.durationDays} days` : ""}</p>
                  </div>
                ))}
                {!packages.length ? <p className="text-xs text-[var(--muted)]">No active advert packages. Add them from Billing.</p> : null}
              </div>
              <Link href="/admin/billing" className="mt-3 inline-flex text-xs font-black text-[var(--brand-dark)] hover:underline">Manage packages</Link>
            </div>

            <div className="app-panel p-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={17} className="text-[var(--brand)]" />
                <h2 className="text-sm font-black text-[var(--ink)]">Payment history</h2>
              </div>
              <div className="mt-3 grid gap-2">
                {request.paymentTransactions.map((payment) => (
                  <div key={payment.id} className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs">
                    <p className="font-black text-[var(--ink)]">{titleCase(payment.status)} / {formatCurrency(Number(payment.amount))}</p>
                    <p className="mt-1 text-[var(--muted)]">{payment.provider} / {payment.reference}</p>
                  </div>
                ))}
                {!request.paymentTransactions.length ? <p className="text-xs text-[var(--muted)]">No gateway payment has been started for this advert yet.</p> : null}
              </div>
            </div>

            {request.product.store ? (
              <Link href={`/stores/${request.product.store.slug}`} className="app-panel app-panel-interactive flex items-center gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-[7px] bg-[var(--brand)] text-white"><Store size={17} /></span>
                <span><span className="block text-sm font-black text-[var(--ink)]">{request.product.store.name}</span><span className="text-xs text-[var(--muted)]">Open seller store</span></span>
              </Link>
            ) : null}
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
