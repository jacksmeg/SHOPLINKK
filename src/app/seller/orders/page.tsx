import Link from "next/link";
import { AlertTriangle, Banknote, ChefHat, ClipboardList, Clock, MapPin, MessageCircle, PackageCheck, Phone, ReceiptText, Truck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FoodOrderActions } from "@/components/seller/food-order-actions";
import { LiveOrdersRefresh } from "@/components/seller/live-orders-refresh";
import { OrderDeleteButton } from "@/components/seller/order-delete-button";
import { MarketplaceOrderActions } from "@/components/seller/marketplace-order-actions";
import { OrderReceiptButton, type ReceiptOrder } from "@/components/seller/order-receipt-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { sellerLinksForKind } from "@/lib/seller-access";
import { compactDate, formatCurrency, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

function orderTone(status: string) {
  if (status === "DELIVERED") return "green";
  if (status === "CANCELLED") return "red";
  if (status === "READY" || status === "OUT_FOR_DELIVERY") return "blue";
  return "gold";
}

export default async function SellerOrdersPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  const [store, foodOrders, marketplaceOrders, conversations, activeDeliveries, pendingProducts] = await Promise.all([
    prisma.store.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        kind: true,
        name: true,
        logoUrl: true,
        phone: true,
        whatsapp: true,
        momoNumber: true,
        address: true,
        location: true,
        area: true,
        announcementBanner: true,
      },
    }),
    prisma.foodOrder.findMany({
      where: { store: { ownerId: session.user.id } },
      include: {
        store: { select: { name: true, logoUrl: true, phone: true, whatsapp: true, momoNumber: true, address: true, location: true, area: true, announcementBanner: true } },
        buyer: { select: { name: true, phone: true, email: true } },
        items: true,
        deliveryRequests: { orderBy: { createdAt: "desc" }, take: 1 },
        deliveries: {
          include: { rider: { include: { user: { select: { name: true, phone: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.marketplaceOrder.findMany({
      where: session.user.role === "ADMIN" ? {} : { sellerId: session.user.id },
      include: {
        buyer: { select: { name: true, phone: true, email: true } },
        store: { select: { name: true, slug: true, logoUrl: true, momoNumber: true, phone: true, whatsapp: true, address: true, location: true, area: true, announcementBanner: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.conversation.findMany({
      where: { sellerId: session.user.id },
      include: {
        product: { select: { title: true, slug: true } },
        buyer: { select: { name: true, phone: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.delivery.count({
      where: {
        sellerId: session.user.id,
        status: { in: ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"] },
      },
    }),
    prisma.product.findMany({
      where: {
        sellerId: session.user.id,
        listingStatus: { in: ["PENDING", "REJECTED", "DRAFT"] },
      },
      include: { category: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const openFoodOrders = foodOrders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const openMarketplaceOrders = marketplaceOrders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const pendingPayments = foodOrders.filter((order) => order.directPaymentStatus === "AWAITING_PAYMENT" || order.directPaymentStatus === "SUBMITTED").length
    + marketplaceOrders.filter((order) => order.directPaymentStatus === "AWAITING_PAYMENT" || order.directPaymentStatus === "SUBMITTED").length;
  const delivered = foodOrders.filter((order) => order.status === "DELIVERED").length
    + marketplaceOrders.filter((order) => order.status === "DELIVERED").length;
  const revenue = foodOrders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalAmount), 0)
    + marketplaceOrders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const urgentCount = openFoodOrders.length + openMarketplaceOrders.length;
  const customerContacts = Array.from(new Map(
    [...marketplaceOrders, ...foodOrders].map((order) => {
      const name = order.buyerName || order.buyer.name || "ShopLinkk buyer";
      const phone = order.buyerPhone || order.buyer.phone || "";
      const email = order.buyer.email || "";
      const key = phone || email || name;
      return [key, {
        name,
        phone,
        email,
        total: Number(order.totalAmount),
        lastAt: order.createdAt,
      }];
    }),
  ).values()).slice(0, 8);

  const marketplaceReceipt = (order: (typeof marketplaceOrders)[number]): ReceiptOrder => ({
    id: order.id,
    kind: "marketplace",
    storeName: order.store?.name || store?.name || "ShopLinkk store",
    storeLogoUrl: order.store?.logoUrl || store?.logoUrl,
    storePhone: order.store?.phone || order.store?.whatsapp || store?.phone || store?.whatsapp,
    storeAddress: order.store?.address || order.store?.area || order.store?.location || store?.address || store?.area || store?.location,
    buyerName: order.buyerName || order.buyer.name,
    buyerPhone: order.buyerPhone || order.buyer.phone,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
    status: titleCase(order.status),
    paymentStatus: titleCase(order.directPaymentStatus),
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    note: order.store?.announcementBanner || store?.announcementBanner,
  });

  const foodReceipt = (order: (typeof foodOrders)[number]): ReceiptOrder => ({
    id: order.id,
    kind: "food",
    storeName: order.store.name || store?.name || "ShopLinkk food store",
    storeLogoUrl: order.store.logoUrl || store?.logoUrl,
    storePhone: order.store.phone || order.store.whatsapp || store?.phone || store?.whatsapp,
    storeAddress: order.store.address || order.store.area || order.store.location || store?.address || store?.area || store?.location,
    buyerName: order.buyerName || order.buyer.name,
    buyerPhone: order.buyerPhone || order.buyer.phone,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
    status: titleCase(order.status),
    paymentStatus: titleCase(order.directPaymentStatus),
    totalAmount: Number(order.totalAmount),
    items: order.items.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    note: order.store.announcementBanner || store?.announcementBanner,
  });

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Live orders"
      description="Watch new orders come in, contact buyers, confirm payments, print receipts, and manage delivery in one workspace."
      links={sellerLinksForKind(store?.kind)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-[8px] bg-[var(--brand-dark)] px-4 py-3 text-white">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Command center</p>
          <p className="mt-1 text-sm font-black">{urgentCount} active order{urgentCount === 1 ? "" : "s"} need attention</p>
        </div>
        <LiveOrdersRefresh seconds={8} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active orders" value={urgentCount} icon={ClipboardList} helper="Food plus product/service" tone="sea" />
        <StatCard label="Payment checks" value={pendingPayments} icon={Banknote} helper="Awaiting seller review" tone="pink" />
        <StatCard label="On delivery" value={activeDeliveries} icon={Truck} helper="Riders moving now" tone="blue" />
        <StatCard label="Delivered" value={delivered} icon={PackageCheck} helper="Completed orders" tone="yellow" />
        <StatCard label="Order value" value={formatCurrency(revenue)} icon={ReceiptText} helper="Non-cancelled total" tone="purple" />
      </div>

      {pendingProducts.length ? (
        <section className="mt-5 app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Listings waiting for admin approval</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">You can still see drafts, pending listings, and rejected products before they go public.</p>
            </div>
            <ButtonLink href="/seller/products" variant="secondary">Open product management</ButtonLink>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {pendingProducts.map((product) => (
              <Link key={product.id} href={`/seller/products/${product.id}/edit`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[var(--ink)]">{product.title}</p>
                    <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{product.category.name} - {compactDate(product.updatedAt)}</p>
                  </div>
                  <Badge tone={product.listingStatus === "REJECTED" ? "red" : product.listingStatus === "DRAFT" ? "neutral" : "gold"}>{titleCase(product.listingStatus)}</Badge>
                </div>
                {product.rejectionReason ? <p className="mt-2 text-[0.68rem] leading-5 text-red-700">{product.rejectionReason}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="app-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-[var(--ink)]">Product and service orders</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Confirm direct payments, call buyers, print invoices, and update delivery status.</p>
            </div>
            <ButtonLink href="/seller/products" variant="secondary">Manage products</ButtonLink>
          </div>

          <div className="mt-4 grid gap-3">
            {marketplaceOrders.slice(0, 16).map((order) => {
              const buyerPhone = order.buyerPhone || order.buyer.phone;
              const paymentRequested = order.sellerPaymentNote?.startsWith("PAYMENT_REQUESTED");
              return (
                <article key={order.id} id={`order-${order.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</h3>
                        <Badge tone={orderTone(order.status)}>{titleCase(order.status)}</Badge>
                        <Badge tone={order.directPaymentStatus === "CONFIRMED" ? "green" : order.directPaymentStatus === "SUBMITTED" ? "blue" : "neutral"}>
                          {titleCase(order.directPaymentStatus)}
                        </Badge>
                        {paymentRequested ? <Badge tone="blue">Payment requested</Badge> : <Badge tone="gold">Seller review</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.title}`).join(", ")}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] font-bold text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><Clock size={12} /> {compactDate(order.createdAt)}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><MapPin size={12} /> {order.deliveryAddress || "Address pending"}</span>
                        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {buyerPhone ? (
                        <ButtonLink href={`tel:${buyerPhone}`} variant="secondary" className="min-h-9 px-3 text-xs">
                          <Phone size={14} />
                          Call buyer
                        </ButtonLink>
                      ) : null}
                      <ButtonLink href="/chat" variant="secondary" className="min-h-9 px-3 text-xs">
                        <MessageCircle size={14} />
                        Chat
                      </ButtonLink>
                      <ButtonLink href={`/seller/orders/${order.id}`} variant="secondary" className="min-h-9 px-3 text-xs">
                        View
                      </ButtonLink>
                      <OrderReceiptButton order={marketplaceReceipt(order)} />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-2">
                    <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Payment state: <strong>{paymentRequested ? `Requested to ${order.store?.momoNumber || order.store?.phone || "your store MoMo"}` : "Waiting for your payment request"}</strong></p>
                    <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Delivery note: <strong>{order.deliveryNote || "No note"}</strong></p>
                    {order.paymentReference ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-[var(--brand-dark)]">Reference: <strong>{order.paymentReference}</strong></p> : null}
                    {order.buyerPaymentNote ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-[var(--brand-dark)]">Buyer payment note: <strong>{order.buyerPaymentNote}</strong></p> : null}
                    {order.paymentProofUrl ? (
                      <ButtonLink href={order.paymentProofUrl} target="_blank" rel="noreferrer" variant="secondary" className="md:col-span-2">
                        View payment proof
                      </ButtonLink>
                    ) : null}
                  </div>
                  <MarketplaceOrderActions orderId={order.id} status={order.status} paymentRequested={paymentRequested} />
                </article>
              );
            })}
            {!marketplaceOrders.length ? <p className="text-xs text-[var(--muted)]">Product and service orders will appear here.</p> : null}
          </div>
        </section>

        <aside className="grid gap-4 self-start">
          <section className="app-panel p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--brand)]" />
              <h2 className="text-sm font-black text-[var(--ink)]">Action queue</h2>
            </div>
            <div className="mt-4 grid gap-2 text-xs">
              <Link href="/seller/orders" className="rounded-[8px] bg-[var(--brand-dark)] p-3 font-black text-white">{pendingPayments} payment confirmation{pendingPayments === 1 ? "" : "s"}</Link>
              <Link href="/seller/delivery" className="rounded-[8px] bg-cyan-700 p-3 font-black text-white">{activeDeliveries} active delivery run{activeDeliveries === 1 ? "" : "s"}</Link>
              <Link href="/seller/reports" className="rounded-[8px] bg-pink-600 p-3 font-black text-white">Open reports and export summary</Link>
            </div>
          </section>

          <section className="app-panel p-4 sm:p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Customer contacts</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Keep good buyers close. Use these contacts for repeat shopping conversations inside ShopLinkk.</p>
            <div className="mt-4 grid gap-2">
              {customerContacts.map((customer) => (
                <div key={`${customer.phone}-${customer.email}-${customer.name}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
                  <p className="text-xs font-black text-[var(--ink)]">{customer.name}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{customer.phone || customer.email || "No contact saved"} - last order {compactDate(customer.lastAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customer.phone ? <ButtonLink href={`tel:${customer.phone}`} variant="secondary" className="min-h-8 px-2.5 text-[0.68rem]">Call</ButtonLink> : null}
                    <ButtonLink href="/chat" variant="secondary" className="min-h-8 px-2.5 text-[0.68rem]">Chat again</ButtonLink>
                  </div>
                </div>
              ))}
              {!customerContacts.length ? <p className="text-xs text-[var(--muted)]">Customer contacts will appear after orders.</p> : null}
            </div>
          </section>

          <section className="app-panel p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-[var(--brand)]" />
              <h2 className="text-sm font-black text-[var(--ink)]">Buyer conversations</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {conversations.map((conversation) => (
                <Link key={conversation.id} href={`/chat/${conversation.id}`} className="rounded-[8px] border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)]">
                  <p className="text-xs font-black text-[var(--ink)]">{conversation.product.title}</p>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{conversation.buyer.name || conversation.buyer.phone || "Buyer"} - {conversation.messages[0]?.body || "Open chat"}</p>
                </Link>
              ))}
              {!conversations.length ? <p className="text-xs text-[var(--muted)]">Product chats will appear here.</p> : null}
            </div>
          </section>

          <section className="app-panel p-4 sm:p-5">
            <h2 className="text-sm font-black text-[var(--ink)]">Receipt setup</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Receipts use your store name, logo, phone, address, and announcement note. Update these in store management before printing.</p>
            <ButtonLink href="/seller/store/edit" variant="secondary" className="mt-4">Edit receipt details</ButtonLink>
          </section>
        </aside>
      </div>

      <section className="mt-5 app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--ink)]">Food orders</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Move restaurant orders from paid to preparing, out for delivery, and delivered.</p>
          </div>
          <ButtonLink href="/seller/food/orders" variant="secondary">Open food order page</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {foodOrders.slice(0, 16).map((order) => {
            const buyerPhone = order.buyerPhone || order.buyer.phone;
            const latestDelivery = order.deliveries[0];
            const latestRequest = order.deliveryRequests[0];
            return (
              <article key={order.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-[var(--ink)]">{order.buyerName || order.buyer.name || "Buyer"}</h3>
                      <Badge tone={orderTone(order.status)}>{titleCase(order.status)}</Badge>
                      <Badge tone={order.directPaymentStatus === "CONFIRMED" ? "green" : order.directPaymentStatus === "SUBMITTED" ? "blue" : "neutral"}>
                        {titleCase(order.directPaymentStatus)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] font-bold text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><ChefHat size={12} /> {order.estimatedDeliveryMinutes ?? "?"} mins</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1"><MapPin size={12} /> {order.deliveryAddress || "Address pending"}</span>
                      <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[var(--brand-dark)]">{formatCurrency(Number(order.totalAmount))}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {buyerPhone ? (
                      <ButtonLink href={`tel:${buyerPhone}`} variant="secondary" className="min-h-9 px-3 text-xs">
                        <Phone size={14} />
                        Call buyer
                      </ButtonLink>
                    ) : null}
                    <OrderReceiptButton order={foodReceipt(order)} />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-2">
                  <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Delivery: <strong>{latestDelivery ? titleCase(latestDelivery.status) : latestRequest ? titleCase(latestRequest.status) : "No rider request yet"}</strong></p>
                  <p className="rounded-[8px] bg-[var(--surface-muted)] p-3">Payment note: <strong>{order.buyerPaymentNote || "No note"}</strong></p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FoodOrderActions orderId={order.id} />
                  <ButtonLink href={`/food-orders/${order.id}`} variant="secondary" className="min-h-9 px-3 text-xs">Track order</ButtonLink>
                  <ButtonLink href="/seller/delivery" variant="secondary" className="min-h-9 px-3 text-xs">Delivery board</ButtonLink>
                  {["DELIVERED", "CANCELLED"].includes(order.status) ? (
                    <OrderDeleteButton endpoint={`/api/seller/food/orders/${order.id}`} />
                  ) : null}
                </div>
              </article>
            );
          })}
          {!foodOrders.length ? <p className="text-xs text-[var(--muted)]">Food orders will appear here after buyers check out.</p> : null}
        </div>
      </section>
    </DashboardShell>
  );
}
