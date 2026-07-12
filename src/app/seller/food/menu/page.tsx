import Image from "next/image";
import { ChefHat } from "lucide-react";
import { FoodMenuItemActions } from "@/components/seller/food-menu-item-actions";
import { FoodMenuManager } from "@/components/seller/food-menu-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerFoodLinks } from "@/lib/seller-food-navigation";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerFoodMenuPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
    include: {
      foodMenuItems: {
        include: { options: true, images: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (store?.kind !== "FOOD") {
    return (
      <DashboardShell eyebrow="Food seller" title="Menu items" description="Turn on food store mode before adding menu items." links={sellerFoodLinks}>
        <div className="app-panel p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Food store mode is not active</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Switch your store type to Food seller / restaurant from store settings.</p>
          <ButtonLink href="/seller/store/edit" className="mt-4">Edit store</ButtonLink>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      eyebrow="Food seller"
      title="Menu management"
      description="Add meals, sides, drinks, add-ons, delivery estimates, photos, and approval-ready menu items."
      links={sellerFoodLinks}
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <FoodMenuManager />

        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Menu items</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Approved items appear in the food marketplace and single food order pages.</p>
            </div>
            <Badge tone="blue">{store.foodMenuItems.length} total</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {store.foodMenuItems.map((item) => (
              <article key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                <div className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                    {item.images[0]?.url || item.imageUrl ? <Image src={item.images[0]?.url ?? item.imageUrl ?? ""} alt={item.name} fill className="object-cover" unoptimized /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-black text-[var(--ink)]">{item.name}</h3>
                      <Badge tone={item.isAvailable ? "green" : "neutral"}>{item.isAvailable ? "Available" : "Hidden"}</Badge>
                      <Badge tone={item.status === "APPROVED" ? "green" : item.status === "REJECTED" ? "red" : item.status === "DRAFT" ? "neutral" : "gold"}>{titleCase(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.basePrice))}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.category || "Food"} - prep {item.prepMinutes || "?"} mins - delivery {item.deliveryMinutes || "?"} mins - {item.images.length} photo{item.images.length === 1 ? "" : "s"} - {item.options.length} add-on{item.options.length === 1 ? "" : "s"}
                    </p>
                    {item.rejectionReason ? <p className="mt-2 rounded-[7px] bg-red-50 p-2 text-xs font-semibold text-red-700">{item.rejectionReason}</p> : null}
                    <FoodMenuItemActions
                      item={{
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        category: item.category,
                        basePrice: Number(item.basePrice),
                        prepMinutes: item.prepMinutes,
                        deliveryMinutes: item.deliveryMinutes,
                        isSpicy: item.isSpicy,
                        isVegetarian: item.isVegetarian,
                        isAvailable: item.isAvailable,
                        status: item.status,
                        imageUrl: item.imageUrl,
                        images: item.images,
                        options: item.options.map((option) => ({ id: option.id, name: option.name, price: Number(option.price) })),
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}
            {!store.foodMenuItems.length ? <EmptyState title="No food items yet" description="Add your first food item to start receiving orders." icon={ChefHat} /> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
