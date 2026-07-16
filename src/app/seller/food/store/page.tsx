import { ArrowLeft, ChefHat, ClipboardList, CreditCard, Megaphone, Settings, ShoppingBasket, Store, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StoreForm } from "@/components/forms/store-form";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerFoodLinks } from "@/lib/seller-food-navigation";

export const dynamic = "force-dynamic";

export default async function FoodStoreSetupPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({ where: { ownerId: session.user.id } });

  return (
    <DashboardShell
      eyebrow="Food seller"
      title="Food shop setup"
      description="Create and manage your restaurant-style ShopLinkk food shop, including menu-ready contact, delivery, kitchen, and ordering settings."
      links={sellerFoodLinks}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink href="/seller/food" variant="secondary">
          <ArrowLeft size={15} />
          Back to food dashboard
        </ButtonLink>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/seller/food/menu" variant="secondary">
            <ClipboardList size={15} />
            Menu
          </ButtonLink>
          <ButtonLink href="/seller/food/orders" variant="secondary">
            <ShoppingBasket size={15} />
            Orders
          </ButtonLink>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          { title: "Food identity", body: "Logo, cover, cuisine, signature dishes", icon: ChefHat, tone: "bg-pink-600 text-white" },
          { title: "Ordering rules", body: "Minimum order, kitchen status, pre-orders", icon: Settings, tone: "bg-cyan-700 text-white" },
          { title: "Delivery", body: "Coverage, prep time, delivery fee", icon: Truck, tone: "bg-yellow-400 text-slate-950" },
          { title: "Sales tools", body: "MoMo, adverts, receipts, finance", icon: CreditCard, tone: "bg-[var(--brand-dark)] text-white" },
        ].map((item) => (
          <div key={item.title} className={`rounded-[8px] p-4 shadow-sm ${item.tone}`}>
            <item.icon size={18} />
            <p className="mt-3 text-sm font-black">{item.title}</p>
            <p className="mt-1 text-xs leading-5 opacity-90">{item.body}</p>
          </div>
        ))}
      </div>

      <StoreForm store={store} preferredKind="FOOD" />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ButtonLink href="/seller/food/menu" variant="secondary">
          <ChefHat size={15} />
          Add menu items
        </ButtonLink>
        <ButtonLink href="/seller/adverts" variant="secondary">
          <Megaphone size={15} />
          Promote meals
        </ButtonLink>
        <ButtonLink href="/seller/store" variant="secondary">
          <Store size={15} />
          Public store view
        </ButtonLink>
      </div>
    </DashboardShell>
  );
}
