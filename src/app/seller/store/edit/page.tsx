import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StoreForm } from "@/components/forms/store-form";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";

export const dynamic = "force-dynamic";

export default async function EditSellerStorePage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({ where: { ownerId: session.user.id } });
  const backHref = store?.kind === "FOOD" ? "/seller/food/store" : "/seller/store";

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Edit store"
      description="Update your store details and prepare your public photos for buyers."
      links={sellerLinksForKind(store?.kind)}
    >
      <ButtonLink href={backHref} variant="secondary"><ArrowLeft size={15} /> Back to store</ButtonLink>
      <div className="mt-4"><StoreForm store={store} preferredKind={store?.kind === "FOOD" ? "FOOD" : "GENERAL"} /></div>
    </DashboardShell>
  );
}
