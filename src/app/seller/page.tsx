import Link from "next/link";
import { BarChart3, Bell, Boxes, ChefHat, ClipboardList, Eye, Megaphone, MessageCircle, PackagePlus, Settings, ShieldCheck, Star, Store, Truck, UserRound, Users, Warehouse } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SellerProductActions } from "@/components/seller/product-actions";
import { VerificationForm } from "@/components/seller/verification-form";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { isContactPrice } from "@/lib/pricing";
import { sellerLinks } from "@/lib/seller-navigation";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, products, chats, followerCount, followers, foodOrders, reviews, unreadNotifications] = await Promise.all([
    prisma.store.findUnique({ where: { ownerId: session.user.id } }),
    prisma.product.findMany({
      where: { sellerId: session.user.id },
      include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversation.count({ where: { sellerId: session.user.id } }),
    prisma.storeFollower.count({ where: { store: { ownerId: session.user.id } } }),
    prisma.storeFollower.findMany({
      where: { store: { ownerId: session.user.id } },
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.foodOrder.findMany({
      where: { store: { ownerId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.review.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  const approved = products.filter((product) => product.listingStatus === "APPROVED").length;
  const drafts = products.filter((product) => product.listingStatus === "DRAFT").length;
  const views = products.reduce((total, product) => total + product.viewCount, 0);
  const lowStock = products.filter((product) => product.stockStatus !== "SOLD" && product.quantity <= 3).length;
  const pendingOrders = foodOrders.filter((order) => ["PENDING_PAYMENT", "PAID", "PREPARING", "OUT_FOR_DELIVERY"].includes(order.status)).length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysFoodSales = foodOrders
    .filter((order) => order.createdAt >= todayStart && order.status !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : store?.ratingAverage ?? 0;

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Dashboard"
      description="Manage your store, listings, stock, and buyer messages."
      links={sellerLinks}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's food sales" value={formatCurrency(todaysFoodSales)} icon={ChefHat} helper="Confirmed and active food orders" tone="sea" />
        <StatCard label="Total products" value={products.length} icon={Boxes} helper={`${approved} visible, ${drafts} drafts`} tone="pink" />
        <StatCard label="Pending orders" value={pendingOrders} icon={ClipboardList} helper="Food orders needing action" tone="yellow" />
        <StatCard label="New messages" value={chats} icon={MessageCircle} helper="Product-linked conversations" tone="blue" />
        <StatCard label="Store visitors" value={views} icon={Eye} helper="Across your products" tone="purple" />
        <StatCard label="Low stock alerts" value={lowStock} icon={Warehouse} helper="3 units or fewer" tone="red" />
        <StatCard label="Reviews" value={averageRating ? averageRating.toFixed(1) : "0.0"} icon={Star} helper={`${reviews.length} recent reviews`} tone="sea" />
        <StatCard label="Notifications" value={unreadNotifications} icon={Bell} helper="Unread alerts" tone="pink" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="app-panel p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--brand)]" size={20} />
            <h2 className="text-sm font-black text-[var(--ink)]">Seller trust</h2>
          </div>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{store?.trustScore ?? 50}%</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Verification: {titleCase(store?.verificationStatus ?? "NOT_SUBMITTED")}
          </p>
        </div>
        <div className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Store availability</h2>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{store?.openingHours || "Add opening hours so buyers know when to reach you."}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{store?.address || store?.area || "Add a store address or area."}</p>
        </div>
        <div className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Response rate</h2>
          <p className="mt-2 text-xl font-black text-[var(--brand-dark)]">{store?.responseRate ?? 0}%</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Reply quickly to improve buyer confidence.</p>
        </div>
        <div className="app-panel p-4">
          <h2 className="text-sm font-black text-[var(--ink)]">Recent followers</h2>
          <div className="mt-3 grid gap-2">
            {followers.slice(0, 4).map((follow) => (
              <div key={follow.id} className="rounded-[7px] bg-[var(--surface-muted)] px-3 py-2">
                <p className="truncate text-xs font-black text-[var(--ink)]">{follow.user.name || follow.user.email || "ShopLinkk buyer"}</p>
                <p className="mt-0.5 text-[0.68rem] text-[var(--muted)]">{compactDate(follow.createdAt)}</p>
              </div>
            ))}
            {!followers.length ? <p className="text-xs leading-5 text-[var(--muted)]">Followers will appear here when buyers follow your store.</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Store management modules</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Quick access to the main seller operations.</p>
            </div>
            <ButtonLink href="/seller/store" variant="secondary"><Settings size={15} /> Store settings</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { href: "/seller/products/new", label: "Add product or service", text: "Post products, services, prices, stock, images, videos, and area.", icon: PackagePlus },
              { href: "/seller/food", label: "Food management", text: "Manage restaurant menu, food photos, add-ons, preparation time, and orders.", icon: ChefHat },
              { href: "/seller/adverts", label: "Promotions", text: "Request homepage adverts, track fees, extensions, and live campaigns.", icon: Megaphone },
              { href: "/chat", label: "Customer chat", text: "Reply to buyers, share product details, and keep response rate strong.", icon: MessageCircle },
              { href: "/seller/store", label: "Verification", text: "Upload business documents and improve trust badge status.", icon: ShieldCheck },
              { href: "/seller/store", label: "Store analytics", text: "Watch visits, followers, reviews, and product engagement.", icon: BarChart3 },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:-translate-y-px hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
                <item.icon className="text-[var(--brand)]" size={18} />
                <p className="mt-3 text-xs font-black text-[var(--ink)]">{item.label}</p>
                <p className="mt-1 text-[0.68rem] leading-5 text-[var(--muted)]">{item.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Truck className="text-[var(--brand)]" size={18} />
            <h2 className="text-sm font-black text-[var(--ink)]">Order and delivery snapshot</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {foodOrders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/food-orders/${order.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-[var(--ink)]">{order.buyerName || "Buyer order"}</span>
                  <Badge tone={order.status === "DELIVERED" ? "green" : order.status === "CANCELLED" ? "red" : "gold"}>{titleCase(order.status)}</Badge>
                </div>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{formatCurrency(Number(order.totalAmount))} / {compactDate(order.createdAt)}</p>
              </Link>
            ))}
            {!foodOrders.length ? <p className="rounded-[8px] bg-[var(--surface-muted)] p-3 text-xs leading-5 text-[var(--muted)]">Food orders and delivery status will appear here when buyers order from your food store.</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-sm font-black text-[var(--ink)]">Your product listings</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">New and edited products go through approval before going public.</p>
        </div>
        <ButtonLink href="/seller/products/new">Add product</ButtonLink>
        <ButtonLink href="/seller/products/bulk" variant="secondary">Bulk upload</ButtonLink>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-[var(--ink)]">{product.title}</h3><p className="mt-1 text-xs text-[var(--muted)]">{product.category.name} · {isContactPrice(product) ? "Contact for price" : formatCurrency(Number(product.price))} · {product.viewCount} views</p></div><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></div>
            <div className="mt-3 border-t border-[var(--line)] pt-3"><SellerProductActions productId={product.id} productSlug={product.slug} productTitle={product.title} approved={product.listingStatus === "APPROVED"} /></div>
            {product.rejectionReason ? <p className="mt-2 text-xs leading-5 text-red-700">Reason: {product.rejectionReason}</p> : product.approvalNote ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{product.approvalNote}</p> : null}
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-hidden rounded-[8px] border border-[var(--line)] bg-white md:block">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 font-bold text-[var(--ink)]">{product.title}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.category.name}</td>
                  <td className="px-4 py-4 font-black text-[var(--brand-dark)]">{isContactPrice(product) ? "Contact for price" : formatCurrency(Number(product.price))}</td>
                  <td className="px-4 py-4"><Badge tone={product.listingStatus === "APPROVED" ? "green" : product.listingStatus === "REJECTED" ? "red" : "gold"}>{titleCase(product.listingStatus)}</Badge></td>
                  <td className="px-4 py-4 text-[var(--muted)]">{titleCase(product.stockStatus)}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{product.viewCount}</td>
                  <td className="px-4 py-4">
                    <SellerProductActions productId={product.id} productSlug={product.slug} productTitle={product.title} approved={product.listingStatus === "APPROVED"} />
                    {product.rejectionReason ? (
                      <p className="mt-2 max-w-sm text-xs leading-5 text-red-700">Reason: {product.rejectionReason}</p>
                    ) : product.approvalNote ? (
                      <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">{product.approvalNote}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!products.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                    No products yet. Add your first listing.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <VerificationForm defaultName={store?.name} />
      </div>
    </DashboardShell>
  );
}
