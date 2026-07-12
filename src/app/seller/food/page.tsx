import Link from "next/link";
import { ChefHat, Clock, ClipboardList, Megaphone, ShoppingBasket, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerFoodLinks } from "@/lib/seller-food-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerFoodDashboardPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
    include: {
      foodMenuItems: { select: { status: true, isAvailable: true } },
      foodOrders: {
        include: { buyer: { select: { name: true, phone: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  if (store?.kind !== "FOOD") {
    return (
      <DashboardShell eyebrow="Seller" title="Food dashboard" description="Create a food store before using food orders." links={sellerFoodLinks}>
        <div className="app-panel p-5">
          <h2 className="text-sm font-black text-[var(--ink)]">Turn on food store mode</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)]">
            Open Store settings, set your store type to Food seller, add your MoMo number, then return here to manage menu items and orders.
          </p>
          <ButtonLink href="/seller/store/edit" className="mt-4">Edit store</ButtonLink>
        </div>
      </DashboardShell>
    );
  }

  const orders = store.foodOrders;
  const activeOrders = orders.filter((order) => ["PENDING_PAYMENT", "PAID", "PREPARING", "OUT_FOR_DELIVERY"].includes(order.status)).length;
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const revenue = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const menuCount = store.foodMenuItems.length;
  const approvedMenu = store.foodMenuItems.filter((item) => item.status === "APPROVED" && item.isAvailable).length;
  const pendingMenu = store.foodMenuItems.filter((item) => item.status === "PENDING").length;

  const modules = [
    {
      href: "/seller/food/menu",
      title: "Menu management",
      body: "Add, edit, delete, hide, and submit food menu items for approval.",
      icon: ClipboardList,
      tone: "bg-cyan-600 text-white",
    },
    {
      href: "/seller/food/orders",
      title: "Order management",
      body: "Confirm MoMo, prepare meals, update delivery, and mark orders delivered.",
      icon: ShoppingBasket,
      tone: "bg-pink-600 text-white",
    },
    {
      href: "/seller/adverts",
      title: "Food adverts",
      body: "Request homepage advert space for meals and promoted food offers.",
      icon: Megaphone,
      tone: "bg-yellow-400 text-slate-950",
    },
  ];

  return (
    <DashboardShell
      eyebrow="Food seller"
      title="Food dashboard"
      description="Manage food menu visibility, live orders, MoMo confirmations, and delivery tracking."
      links={sellerFoodLinks}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Menu items" value={menuCount} icon={ChefHat} helper={`${approvedMenu} visible to buyers`} tone="sea" />
        <StatCard label="Pending approval" value={pendingMenu} icon={Clock} helper="Waiting for admin" tone="yellow" />
        <StatCard label="Active orders" value={activeOrders} icon={ShoppingBasket} helper="Need attention" tone="pink" />
        <StatCard label="Delivered" value={delivered} icon={Truck} helper="Recent completed orders" tone="purple" />
        <StatCard label="Food sales" value={formatCurrency(revenue)} icon={ChefHat} helper="Non-cancelled orders" tone="blue" />
      </div>

      <section className="mt-5 grid gap-3 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className={`rounded-[8px] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${module.tone}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-black">{module.title}</h2>
                <p className="mt-2 text-xs leading-5 opacity-90">{module.body}</p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-white/20">
                <module.icon size={18} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-5 app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--ink)]">Recent orders</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Latest buyer food activity for quick action.</p>
          </div>
          <ButtonLink href="/seller/food/orders" variant="secondary">Open orders</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{compactDate(order.createdAt)} - {order.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                  <p className="mt-2 text-sm font-black text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</p>
                </div>
              </div>
            </article>
          ))}
          {!orders.length ? (
            <div className="rounded-[8px] border border-dashed border-[var(--line)] p-5 text-center text-xs text-[var(--muted)]">
              No food orders yet. Approved menu items will appear to buyers in the food marketplace.
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}
