import { Star } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";
import { prisma } from "@/lib/db";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BuyerReviewsPage() {
  const session = await requireUser();
  const reviews = await prisma.review.findMany({ where: { authorId: session.user.id }, include: { seller: true, product: true, store: true }, orderBy: { createdAt: "desc" } });
  return (
    <DashboardShell eyebrow="Buyer" title="My reviews" description="Reviews and ratings you have given to sellers, products, stores, and future riders." links={buyerLinks}>
      <StatCard label="Reviews written" value={reviews.length} icon={Star} helper="Buyer feedback" tone="yellow" />
      <div className="mt-5 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="app-panel p-4">
            <p className="text-sm font-black text-[var(--ink)]">{review.store?.name || review.seller.name || "Seller"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{review.product?.title || "Store review"} - {compactDate(review.createdAt)}</p>
            <p className="mt-2 text-xs font-black text-yellow-600">{review.rating}/5</p>
            {review.comment ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{review.comment}</p> : null}
          </article>
        ))}
        {!reviews.length ? <p className="text-xs text-[var(--muted)]">After a successful purchase, leave a review from the seller or product page.</p> : null}
      </div>
    </DashboardShell>
  );
}
