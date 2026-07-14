import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
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
    include: { items: true, store: { select: { name: true } } },
  });
  if (!order) return jsonError("Marketplace order not found.", 404);

  if (["READY", "DELIVERED"].includes(parsed.data.status) && order.directPaymentStatus !== "CONFIRMED") {
    return jsonError("Confirm payment received before moving this order forward.", 409);
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.status === "PAID" && order.directPaymentStatus !== "CONFIRMED") {
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
        status: parsed.data.status,
        directPaymentStatus: parsed.data.status === "PAID"
          ? "CONFIRMED"
          : parsed.data.status === "CANCELLED"
            ? "CANCELLED"
            : undefined,
        sellerPaymentNote: parsed.data.note || order.sellerPaymentNote,
        paymentConfirmedAt: parsed.data.status === "PAID" ? now : undefined,
        deliveredAt: parsed.data.status === "DELIVERED" ? now : undefined,
        cancelledAt: parsed.data.status === "CANCELLED" ? now : undefined,
      },
    });
  });

  await notifyUser({
    userId: order.buyerId,
    type: "SYSTEM",
    title: "Marketplace order updated",
    body: `${order.store?.name || "A seller"} marked your order as ${parsed.data.status.toLowerCase().replace(/_/g, " ")}.`,
    href: "/buyer/orders",
  });

  return NextResponse.json(updated);
}
