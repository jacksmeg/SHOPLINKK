import { Flag, Star, Store } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { compactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireRole(["ADMIN"]);
  const reviews = await prisma.review.findMany({ include: { author: true, seller: true, store: true, product: true }, orderBy: { createdAt: "desc" }, take: 100 });
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return (
    <DashboardShell eyebrow="Admin" title="Reviews management" description="Moderate fake reviews, pin helpful reviews later, and inspect store/product ratings." links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Reviews" value={reviews.length} icon={Star} helper="All recent reviews" tone="yellow" />
        <StatCard label="Average" value={average ? average.toFixed(1) : "0.0"} icon={Store} helper="Platform rating" tone="sea" />
        <StatCard label="Moderation" value="Ready" icon={Flag} helper="Delete/report flow prepared" tone="red" />
      </div>
      <div className="mt-5 grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="app-panel p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <p className="text-sm font-black text-[var(--ink)]">{review.store?.name || review.seller.name || "Seller"}</p>
              <p className="text-xs font-black text-yellow-600">{review.rating}/5</p>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{review.author.name || review.author.email || "Buyer"} - {review.product?.title || "Store review"} - {compactDate(review.createdAt)}</p>
            {review.comment ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{review.comment}</p> : null}
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
