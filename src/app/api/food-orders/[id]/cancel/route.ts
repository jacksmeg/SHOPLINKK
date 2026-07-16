import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const order = await prisma.foodOrder.findFirst({
    where: { id, buyerId: session.user.id },
    include: { store: { select: { name: true, ownerId: true } } },
  });
  if (!order) return jsonError("Food order not found.", 404);

  if (["PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) || order.directPaymentStatus === "CONFIRMED") {
    return jsonError("The seller has already accepted this order. Please contact the seller to cancel.", 409);
  }
  if (order.status === "CANCELLED") return NextResponse.json(order);

  const cancelled = await prisma.foodOrder.update({
    where: { id },
    data: { status: "CANCELLED", directPaymentStatus: "CANCELLED" },
  });

  await notifyUser({
    userId: order.store.ownerId,
    type: "SYSTEM",
    title: "Food order cancelled",
    body: `${session.user.name || "A buyer"} cancelled an order from ${order.store.name}.`,
    href: "/seller/food/orders",
  });

  return NextResponse.json(cancelled);
}
