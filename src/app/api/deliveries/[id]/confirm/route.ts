import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { deliveryConfirmSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const parsed = deliveryConfirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose buyer or seller confirmation");

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }, ...(session.user.role === "ADMIN" ? [{}] : [])],
    },
    include: { rider: { select: { userId: true } }, request: { select: { productName: true } } },
  });
  if (!delivery) return jsonError("Delivery not found", 404);

  if (parsed.data.role === "BUYER" && delivery.buyerId !== session.user.id && session.user.role !== "ADMIN") {
    return jsonError("Only the buyer can confirm buyer receipt", 403);
  }
  if (parsed.data.role === "SELLER" && delivery.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return jsonError("Only the seller can confirm seller handover", 403);
  }

  const now = new Date();
  const updated = await prisma.delivery.update({
    where: { id },
    data: parsed.data.role === "BUYER" ? { buyerConfirmedAt: now } : { sellerConfirmedAt: now },
  });

  await notifyUser({
    userId: delivery.rider.userId,
    type: "DELIVERY",
    title: "Delivery confirmation received",
    body: `${parsed.data.role.toLowerCase()} confirmed ${delivery.request.productName}.`,
    href: `/deliveries/${delivery.id}`,
  });

  return NextResponse.json({ delivery: updated });
}
