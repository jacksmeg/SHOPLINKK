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

  if (parsed.data.status === "REQUEST_PAYMENT") {
    const paymentTarget = order.store?.momoNumber || order.store?.phone || "seller Mobile Money number";
    const sellerNote = parsed.data.note ? `PAYMENT_REQUESTED: ${parsed.data.note}` : "PAYMENT_REQUESTED";
    const updated = await prisma.marketplaceOrder.update({
      where: { id },
      data: {
        sellerPaymentNote: sellerNote,
        directPaymentStatus: "AWAITING_PAYMENT",
      },
    });

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

  const nextStatus = parsed.data.status as "PAID" | "READY" | "DELIVERED" | "CANCELLED";

  if (["READY", "DELIVERED"].includes(nextStatus) && order.directPaymentStatus !== "CONFIRMED") {
    return jsonError("Confirm payment received before moving this order forward.", 409);
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === "PAID" && order.directPaymentStatus !== "CONFIRMED") {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { quantity: true, listingType: true },
        });
        if (!product || product.listingType !== "PRODUCT") continue;
        const nextQuantity = Math.max(0, product.quantity - item.quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: nextQuantity,
            stockStatus: nextQuantity === 0 ? "OUT_OF_STOCK" : undefined,
          },
        });
      }
    }

    return tx.marketplaceOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        directPaymentStatus: nextStatus === "PAID"
          ? "CONFIRMED"
          : nextStatus === "CANCELLED"
            ? "CANCELLED"
            : undefined,
        sellerPaymentNote: parsed.data.note || order.sellerPaymentNote,
        paymentConfirmedAt: nextStatus === "PAID" ? now : undefined,
        deliveredAt: nextStatus === "DELIVERED" ? now : undefined,
        cancelledAt: nextStatus === "CANCELLED" ? now : undefined,
      },
    });
  });

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
