import { BadgeCheck, Gift, Star, Trophy } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  await requireRole(["ADMIN"]);
  return (
    <AdminModulePage
      title="Reward and loyalty management"
      description="Manage reward points, referral bonuses, badges, seller levels, rider levels, and buyer loyalty."
      stats={[
        { label: "Reward points", value: 0, icon: Trophy, helper: "Future program", tone: "yellow" },
        { label: "Referral bonuses", value: "Ready", icon: Gift, helper: "Invite rewards", tone: "pink" },
        { label: "Badges", value: "Ready", icon: BadgeCheck, helper: "Trust badges", tone: "sea" },
        { label: "Levels", value: "Ready", icon: Star, helper: "Seller/rider levels", tone: "purple" },
      ]}
      actions={[
        { title: "Buyer loyalty", body: "Reward buyers for purchases, reviews, following stores, and safe marketplace activity." },
        { title: "Seller levels", body: "Promote sellers based on response rate, completion rate, reviews, and trust score." },
        { title: "Rider levels", body: "Reward riders by delivery success, ratings, reliability, and safe conduct." },
      ]}
    />
  );
}
