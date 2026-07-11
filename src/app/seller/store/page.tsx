import { BadgeCheck, MessageCircle, PackagePlus, Settings, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StoreForm } from "@/components/forms/store-form";
import { VerificationForm } from "@/components/seller/verification-form";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, chats] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id } }),
    prisma.product.count({ where: { sellerId: session.user.id } }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
  ]);

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Store management"
      description="Manage your public seller identity, contact details, store photos, verification, and buyer trust signals."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/store", label: "Store management", icon: Settings },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Store trust" value={`${store?.trustScore ?? 50}%`} icon={BadgeCheck} helper={`Verification: ${titleCase(store?.verificationStatus ?? "NOT_SUBMITTED")}`} />
        <StatCard label="Listings" value={products} icon={PackagePlus} helper="Products connected to this seller account" />
        <StatCard label="Buyer chats" value={chats} icon={MessageCircle} helper="Product-linked conversations" />
      </div>

      <div className="mt-5">
        <StoreForm store={store} />
      </div>

      <div className="mt-6">
        <VerificationForm defaultName={store?.name} />
      </div>
    </DashboardShell>
  );
}
