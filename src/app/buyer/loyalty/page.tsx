import { BadgeCheck, Gift, Trophy } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";

export const dynamic = "force-dynamic";

export default async function BuyerLoyaltyPage() {
  await requireUser();
  return (
    <DashboardShell eyebrow="Buyer" title="Loyalty program" description="Future reward points, badges, coupons, referral bonuses, and buyer levels." links={buyerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Reward points" value="0" icon={Trophy} helper="Coming soon" tone="yellow" />
        <StatCard label="Badges" value="New buyer" icon={BadgeCheck} helper="Community trust" tone="sea" />
        <StatCard label="Coupons" value="0" icon={Gift} helper="Future offers" tone="pink" />
      </div>
      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {["Buy locally", "Review fairly", "Follow trusted stores"].map((item) => (
          <div key={item} className="app-panel p-4">
            <h2 className="text-sm font-black text-[var(--ink)]">{item}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">ShopLinkk will use these actions for future reward badges and referral bonuses.</p>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
