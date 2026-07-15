import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifySellerOrderAlert } from "@/lib/notifications";
import { getActiveSalePrice } from "@/lib/pricing";
import { marketplaceOrderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = marketplaceOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Check your order details.");
  }

  const requestedItems = new Map<string, number>();
  for (const item of parsed.data.items) {
    requestedItems.set(item.productId, (requestedItems.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: Array.from(requestedItems.keys()) },
      listingStatus: "APPROVED",
      stockStatus: { notIn: ["SOLD", "OUT_OF_STOCK"] },
    },
    include: {
      seller: { select: { id: true, name: true } },
      store: { select: { id: true, name: true, slug: true, momoNumber: true, phone: true, ownerId: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  if (products.length !== requestedItems.size) {
    return jsonError("One or more cart items are no longer available.", 409);
  }

  const paymentSubmitted = Boolean(parsed.data.paymentReference || parsed.data.paymentProofUrl || parsed.data.buyerPaymentNote);
  const groups = new Map<string, {
    sellerId: string;
    storeId: string | null;
    sellerName: string;
    storeName: string;
    items: Array<{
      productId: string;
      title: string;
      slug: string;
      imageUrl?: string | null;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }>();

  for (const product of products) {
    if (product.sellerId === session.user.id) {
      return jsonError("You cannot order from your own listing.", 409);
    }
    if (product.priceMode === "CONTACT") {
      return jsonError(`${product.title} is contact-for-price. Chat with the seller instead.`);
    }
    const quantity = requestedItems.get(product.id) ?? 1;
    if (product.listingType === "PRODUCT" && quantity > product.quantity) {
      return jsonError(`Only ${product.quantity} unit(s) of ${product.title} are available.`);
    }

    const normalizedProduct = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
    };
    const unitPrice = getActiveSalePrice(normalizedProduct) ?? Number(product.price);
    const groupKey = `${product.sellerId}:${product.storeId ?? "personal"}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        sellerId: product.sellerId,
        storeId: product.storeId,
        sellerName: product.seller.name || "Seller",
        storeName: product.store?.name || product.seller.name || "Seller",
        items: [],
      });
    }
    groups.get(groupKey)!.items.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      imageUrl: product.images[0]?.url,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = [];
    for (const group of groups.values()) {
      const totalAmount = group.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const order = await tx.marketplaceOrder.create({
        data: {
          buyerId: session.user.id,
          sellerId: group.sellerId,
          storeId: group.storeId,
          status: paymentSubmitted ? "PAYMENT_SUBMITTED" : "PENDING_PAYMENT",
          directPaymentStatus: paymentSubmitted ? "SUBMITTED" : "AWAITING_PAYMENT",
          buyerName: parsed.data.buyerName || session.user.name,
          buyerPhone: parsed.data.buyerPhone || session.user.phone,
          deliveryAddress: parsed.data.deliveryAddress,
          deliveryNote: parsed.data.deliveryNote || null,
          paymentReference: parsed.data.paymentReference || null,
          paymentProofUrl: parsed.data.paymentProofUrl || null,
          buyerPaymentNote: parsed.data.buyerPaymentNote || null,
          paymentSubmittedAt: paymentSubmitted ? new Date() : null,
          totalAmount,
          items: {
            create: group.items.map((item) => ({
              productId: item.productId,
              title: item.title,
              slug: item.slug,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true, store: { select: { name: true, momoNumber: true, phone: true } } },
      });
      orders.push({
        id: order.id,
        sellerId: group.sellerId,
        storeName: group.storeName,
        totalAmount,
        momoNumber: order.store?.momoNumber || order.store?.phone || null,
        productIds: group.items.map((item) => item.productId),
      });
    }
    return orders;
  });

  await Promise.all(createdOrders.map((order) => notifySellerOrderAlert({
    sellerId: order.sellerId,
    title: paymentSubmitted ? "Marketplace payment submitted" : "New marketplace order",
    body: `${session.user.name || "A buyer"} placed a direct MoMo order with ${order.storeName}.`,
    href: "/seller/orders",
    buyerName: session.user.name,
    storeName: order.storeName,
    amount: order.totalAmount,
  }))).catch(() => null);

  return NextResponse.json({ orders: createdOrders }, { status: 201 });
}
