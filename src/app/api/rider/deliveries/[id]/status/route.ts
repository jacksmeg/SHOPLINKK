import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deliveryStatusTimestamp, trackingUrl } from "@/lib/delivery";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { deliveryStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["RIDER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = deliveryStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a valid delivery status");

  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { riderId: profile?.id ?? "__missing__" }),
    },
    include: {
      request: { select: { productName: true } },
      rider: { include: { user: { select: { name: true } } } },
    },
  });
  if (!delivery) return jsonError("Delivery not found", 404);

  const status = parsed.data.status;
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.delivery.update({
      where: { id },
      data: {
        status,
        ...deliveryStatusTimestamp(status, now),
      },
    });

    if (delivery.foodOrderId && status === "ON_THE_WAY") {
      await tx.foodOrder.update({
        where: { id: delivery.foodOrderId },
        data: { status: "OUT_FOR_DELIVERY", outForDeliveryAt: now },
      });
    }

    if (delivery.foodOrderId && status === "DELIVERED") {
      await tx.foodOrder.update({
        where: { id: delivery.foodOrderId },
        data: { status: "DELIVERED", deliveredAt: now },
      });
    }

    if (["DELIVERED", "CANCELLED"].includes(status)) {
      await tx.riderProfile.update({
        where: { id: delivery.riderId },
        data: { availability: status === "DELIVERED" ? "ONLINE" : "ONLINE" },
      });
    }

    return next;
  });

  const readable = status.toLowerCase().replace(/_/g, " ");
  await Promise.all([
    notifyUser({
      userId: delivery.buyerId,
      type: "DELIVERY",
      title: "Delivery updated",
      body: `${delivery.request.productName} is now ${readable}.`,
      href: trackingUrl(delivery.id),
    }),
    notifyUser({
      userId: delivery.sellerId,
      type: "DELIVERY",
      title: "Delivery updated",
      body: `${delivery.rider.user.name || "Your rider"} marked ${delivery.request.productName} as ${readable}.`,
      href: trackingUrl(delivery.id),
    }),
  ]);

  return NextResponse.json({ delivery: updated });
}
