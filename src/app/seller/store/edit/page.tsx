import { ArrowLeft, MessageCircle, Megaphone, PackagePlus, Settings, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StoreForm } from "@/components/forms/store-form";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditSellerStorePage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({ where: { ownerId: session.user.id } });

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Edit store"
      description="Update your store details and prepare your public photos for buyers."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/store", label: "Store management", icon: Settings },
        { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <ButtonLink href="/seller/store" variant="secondary"><ArrowLeft size={15} /> Back to store</ButtonLink>
      <div className="mt-4"><StoreForm store={store} /></div>
    </DashboardShell>
  );
}
