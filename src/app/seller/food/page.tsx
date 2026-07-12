import Image from "next/image";
import { ChefHat, Megaphone, MessageCircle, PackagePlus, Settings, Store, UserRound } from "lucide-react";
import { FoodMenuManager } from "@/components/seller/food-menu-manager";
import { FoodOrderActions } from "@/components/seller/food-order-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const links = [
  { href: "/seller", label: "Overview", icon: Store },
  { href: "/seller/store", label: "Store management", icon: Settings },
  { href: "/seller/food", label: "Food orders", icon: ChefHat },
  { href: "/seller/adverts", label: "Adverts", icon: Megaphone },
  { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
  { href: "/chat", label: "Buyer messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default async function SellerFoodPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
    include: {
      foodMenuItems: { include: { options: true }, orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }] },
      foodOrders: {
        include: { buyer: { select: { name: true, phone: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Food management"
      description="Manage food menu items, MoMo confirmations, and delivery tracking."
      links={links}
    >
      {store?.kind !== "FOOD" ? (
        <div className="app-panel p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Turn on food store mode</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Open Store management, set Store type to Food seller / restaurant, and add your MoMo number before taking food orders.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-5">
            <FoodMenuManager />
            <section className="app-panel p-4 sm:p-5">
              <h2 className="text-sm font-black text-[var(--ink)]">Menu items</h2>
              <div className="mt-4 grid gap-3">
                {store.foodMenuItems.map((item) => (
                  <article key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                    <div className="flex gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs font-black text-[var(--ink)]">{item.name}</h3>
                          <Badge tone={item.isAvailable ? "green" : "neutral"}>{item.isAvailable ? "Available" : "Hidden"}</Badge>
                        </div>
                        <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(Number(item.basePrice))}</p>
                        {item.options.length ? <p className="mt-1 text-xs text-[var(--muted)]">{item.options.length} add-on{item.options.length === 1 ? "" : "s"}</p> : null}
                      </div>
                    </div>
                  </article>
                ))}
                {!store.foodMenuItems.length ? <EmptyState title="No food items yet" description="Add your first food item to start receiving orders." icon={ChefHat} /> : null}
              </div>
            </section>
          </div>

          <section className="app-panel p-4 sm:p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Food orders</h2>
            <div className="mt-4 grid gap-3">
              {store.foodOrders.map((order) => (
                <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{order.buyerPhone || order.buyer.phone || "No phone"} - {order.deliveryAddress}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                      <p className="mt-2 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
                    </div>
                  </div>
                  <ul className="mt-3 grid gap-1 text-xs text-[var(--muted)]">
                    {order.items.map((item) => (
                      <li key={item.id}>{item.quantity}x {item.name} - {formatCurrency(Number(item.lineTotal))}</li>
                    ))}
                  </ul>
                  {order.paymentReference ? <p className="mt-2 text-xs text-[var(--muted)]">Payment reference: <strong>{order.paymentReference}</strong></p> : null}
                  {order.deliveryNote ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{order.deliveryNote}</p> : null}
                  <FoodOrderActions orderId={order.id} />
                </article>
              ))}
              {!store.foodOrders.length ? <EmptyState title="No food orders yet" description="Orders from buyers will appear here." icon={ChefHat} /> : null}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
