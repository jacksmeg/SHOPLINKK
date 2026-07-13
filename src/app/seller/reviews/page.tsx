import { Flag, MessageCircle, Star } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerReviewsPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const reviews = await prisma.review.findMany({
    where: { sellerId: session.user.id },
    include: { author: { select: { name: true, email: true } }, product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <DashboardShell eyebrow="Seller" title="Reviews" description="See buyer reviews, report fake reviews, and respond through buyer chat." links={sellerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Average rating" value={average ? average.toFixed(1) : "0.0"} icon={Star} helper="Out of 5" tone="yellow" />
        <StatCard label="Reviews" value={reviews.length} icon={MessageCircle} helper="Recent buyer feedback" tone="sea" />
        <StatCard label="Reports" value="Ready" icon={Flag} helper="Report fake reviews to admin" tone="red" />
      </div>
      <div className="mt-5 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="app-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--ink)]">{review.author.name || review.author.email || "Buyer"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{review.product?.title || "Store review"} - {compactDate(review.createdAt)}</p>
              </div>
              <p className="text-sm font-black text-yellow-600">{"*".repeat(review.rating)}<span className="text-[var(--line)]">{"*".repeat(5 - review.rating)}</span></p>
            </div>
            {review.comment ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{review.comment}</p> : null}
            <div className="mt-3 flex gap-2">
              <ButtonLink href="/chat" variant="secondary">Reply by chat</ButtonLink>
              <ButtonLink href="/contact" variant="ghost">Report fake review</ButtonLink>
            </div>
          </article>
        ))}
        {!reviews.length ? <p className="rounded-[8px] border border-dashed border-[var(--line)] p-5 text-center text-xs text-[var(--muted)]">No reviews yet.</p> : null}
      </div>
    </DashboardShell>
  );
}
