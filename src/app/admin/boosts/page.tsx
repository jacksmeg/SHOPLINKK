import Link from "next/link";
import { CalendarDays, CircleDollarSign, Megaphone } from "lucide-react";
import { BoostActions } from "@/components/admin/boost-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBoostsPage() {
  await requireRole(["ADMIN"]);
  const requests = await prisma.productBoostRequest.findMany({
    include: {
      product: { select: { title: true, slug: true, isFeatured: true } },
      seller: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <DashboardShell eyebrow="Admin" title="Homepage adverts" description="Set offline fees, confirm payment records, and control which seller products run on the buyer homepage." links={adminLinks}>
      <div className="mb-4 flex items-start gap-3 rounded-[8px] border border-cyan-200 bg-cyan-50 p-3 text-xs leading-5 text-cyan-950">
        <Megaphone className="mt-0.5 shrink-0" size={16} />
        ShopLinkk does not collect advert fees online yet. Record only fees you have independently confirmed, then start the campaign.
      </div>
      <div className="grid gap-4">
        {requests.map((request) => (
          <article key={request.id} className="app-panel app-panel-interactive p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/products/${request.product.slug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand)]">{request.product.title}</Link>
                <p className="mt-1 text-xs text-[var(--muted)]">{request.seller.name ?? request.seller.email} · {compactDate(request.createdAt)}</p>
                {request.seller.phone ? <p className="mt-1 text-[0.68rem] text-[var(--muted)]">Seller phone: {request.seller.phone}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={request.paymentStatus === "CONFIRMED" || request.paymentStatus === "WAIVED" ? "blue" : "neutral"}>{titleCase(request.paymentStatus)}</Badge>
                <Badge tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "red" : "gold"}>{titleCase(request.status)}</Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-[7px] bg-[var(--surface-muted)] p-3 sm:grid-cols-3">
              <div><p className="text-[0.68rem] font-semibold text-[var(--muted)]">Campaign</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.headline || request.requestedFor || "Homepage product advert"}</p></div>
              <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><CalendarDays size={12} /> Duration</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.durationDays} days{request.endsAt ? ` · ends ${compactDate(request.endsAt)}` : ""}</p></div>
              <div><p className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--muted)]"><CircleDollarSign size={12} /> Recorded fee</p><p className="mt-1 text-xs font-bold text-[var(--ink)]">{request.paymentStatus === "WAIVED" ? "Waived" : request.feeAmount ? formatCurrency(Number(request.feeAmount)) : "Not set"}</p></div>
            </div>
            {request.note ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--ink)]">Note:</strong> {request.note}</p> : null}
            {request.status === "REQUESTED" ? <BoostActions requestId={request.id} initialDays={request.durationDays} initialFee={request.feeAmount ? Number(request.feeAmount) : null} initialPaymentStatus={request.paymentStatus} initialReference={request.feeReference} /> : null}
          </article>
        ))}
        {!requests.length ? <EmptyState title="No advert requests" description="Seller requests for animated homepage promotion will appear here." icon={Megaphone} /> : null}
      </div>
    </DashboardShell>
  );
}
