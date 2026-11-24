import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyBuyerPaymentRequest, notifyUser } from "@/lib/notifications";
import { marketplaceOrderStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = marketplaceOrderStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Choose a valid order status.");
  }

  const order = await prisma.marketplaceOrder.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    include: { items: true, store: { select: { name: true, momoNumber: true, phone: true } } },
  });
  if (!order) return jsonError("Marketplace order not found.", 404);

  const nextStatus = parsed.data.status;
  if (nextStatus === order.status) return NextResponse.json(order);

  const requestingPayment = nextStatus === "REQUEST_PAYMENT";
  const confirming = nextStatus === "PAID";
  const cancelling = nextStatus === "CANCELLED";
  const awaitingPayment = ["PENDING_PAYMENT", "PAYMENT_SUBMITTED"].includes(order.status);
  const canAdvance = (nextStatus === "READY" && order.status === "PAID")
    || (nextStatus === "DELIVERED" && ["PAID", "READY"].includes(order.status));

  if (requestingPayment && order.stockReserved && awaitingPayment) return NextResponse.json(order);
  if (!(awaitingPayment && (requestingPayment || confirming || cancelling))
    && !(cancelling && ["PAID", "READY"].includes(order.status))
    && !(canAdvance && order.directPaymentStatus === "CONFIRMED")) {
    return jsonError("This order cannot move to that status.", 409);
  }

  const now = new Date();
  const sellerNote = parsed.data.note ? `PAYMENT_REQUESTED: ${parsed.data.note}` : "PAYMENT_REQUESTED";
  const conflict = new Error("Order or stock changed. Refresh and try again.");
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.marketplaceOrder.updateMany({
      where: { id, updatedAt: order.updatedAt, status: order.status, stockReserved: order.stockReserved },
      data: requestingPayment
        ? { sellerPaymentNote: sellerNote, stockReserved: true }
        : {
            status: nextStatus,
            stockReserved: false,
            directPaymentStatus: confirming ? "CONFIRMED" : cancelling ? "CANCELLED" : undefined,
            sellerPaymentNote: parsed.data.note || order.sellerPaymentNote,
            paymentConfirmedAt: confirming ? now : undefined,
            deliveredAt: nextStatus === "DELIVERED" ? now : undefined,
            cancelledAt: cancelling ? now : undefined,
          },
    });
    if (!claimed.count) throw conflict;

    if (requestingPayment || confirming) {
      const items = [...order.items].sort((a, b) => (a.productId ?? "").localeCompare(b.productId ?? ""));
      for (const item of items) {
        if (!item.productId) throw conflict;
        const [product] = await tx.$queryRaw<{ listingType: string; quantity: number; stockStatus: string }[]>`
          SELECT "listingType", "quantity", "stockStatus" FROM "Product"
          WHERE id = ${item.productId} FOR UPDATE
        `;
        if (!product) throw conflict;
        if (product.listingType !== "PRODUCT") continue;

        const held = await tx.marketplaceOrderItem.aggregate({
          where: { productId: item.productId, orderId: { not: id }, order: { stockReserved: true } },
          _sum: { quantity: true },
        });
        const available = product.quantity - (held._sum.quantity ?? 0);
        if (product.stockStatus !== "AVAILABLE" || available < item.quantity) {
          throw new Error(`Insufficient stock for ${item.title}.`);
        }

        if (confirming) {
          const quantity = product.quantity - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity, stockStatus: quantity === 0 ? "OUT_OF_STOCK" : undefined },
          });
        }
      }
    }

    return tx.marketplaceOrder.findUniqueOrThrow({ where: { id } });
  }).catch((error: unknown) => {
    if (error === conflict || (error instanceof Error && error.message.startsWith("Insufficient stock for "))) return error;
    throw error;
  });
  if (updated instanceof Error) return jsonError(updated.message, 409);

  if (requestingPayment) {
    const paymentTarget = order.store?.momoNumber || order.store?.phone || "seller Mobile Money number";
    await notifyBuyerPaymentRequest({
      buyerId: order.buyerId,
      title: "Seller approved your order",
      body: `${order.store?.name || "The seller"} approved your order. Pay to ${paymentTarget}, then upload your proof in ShopLinkk.`,
      href: "/buyer/orders",
      storeName: order.store?.name,
      amount: Number(order.totalAmount),
    });
    return NextResponse.json(updated);
  }

  await notifyUser({
    userId: order.buyerId,
    type: "SYSTEM",
    title: "Marketplace order updated",
    body: `${order.store?.name || "A seller"} marked your order as ${nextStatus.toLowerCase().replace(/_/g, " ")}.`,
    href: "/buyer/orders",
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const order = await prisma.marketplaceOrder.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    select: { id: true, status: true, buyerId: true, store: { select: { name: true } } },
  });
  if (!order) return jsonError("Marketplace order not found.", 404);
  if (!["DELIVERED", "CANCELLED"].includes(order.status)) {
    return jsonError("Only completed or cancelled orders can be deleted.", 409);
  }

  await prisma.marketplaceOrder.delete({ where: { id } });
  await notifyUser({
    userId: order.buyerId,
    type: "SYSTEM",
    title: "Marketplace order closed",
    body: `${order.store?.name || "A seller"} closed a completed marketplace order record.`,
    href: "/buyer/orders",
  });

  return NextResponse.json({ ok: true });
}
