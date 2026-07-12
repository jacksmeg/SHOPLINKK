import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { foodOrderStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = foodOrderStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a valid order status.");

  const order = await prisma.foodOrder.findFirst({
    where: {
      id,
      store: session.user.role === "ADMIN" ? undefined : { ownerId: session.user.id },
    },
    include: { store: { select: { name: true } } },
  });
  if (!order) return jsonError("Food order not found.", 404);

  const now = new Date();
  const updated = await prisma.foodOrder.update({
    where: { id },
    data: {
      status: parsed.data.status,
      sellerPaymentNote: parsed.data.note || order.sellerPaymentNote,
      paymentConfirmedAt: parsed.data.status === "PAID" ? now : undefined,
      outForDeliveryAt: parsed.data.status === "OUT_FOR_DELIVERY" ? now : undefined,
      deliveredAt: parsed.data.status === "DELIVERED" ? now : undefined,
    },
  });

  await notifyUser({
    userId: order.buyerId,
    type: "SYSTEM",
    title: "Food order updated",
    body: `${order.store.name} marked your order as ${parsed.data.status.toLowerCase().replace(/_/g, " ")}.`,
    href: "/buyer/food-orders",
  });

  return NextResponse.json(updated);
}
