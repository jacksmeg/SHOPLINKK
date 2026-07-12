import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackingUrl } from "@/lib/delivery";
import { auditLog, notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { adminDeliveryAssignSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = adminDeliveryAssignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose an approved rider");

  const deliveryRequest = await prisma.deliveryRequest.findUnique({ where: { id } });
  if (!deliveryRequest || deliveryRequest.status !== "OPEN") return jsonError("Delivery request is not open", 409);

  const rider = await prisma.riderProfile.findFirst({
    where: { id: parsed.data.riderId, status: "APPROVED" },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!rider) return jsonError("Approved rider not found", 404);

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const assigned = await tx.deliveryRequest.update({
      where: { id },
      data: { riderId: rider.id, status: "ACCEPTED", acceptedAt: now },
    });
    const delivery = await tx.delivery.create({
      data: {
        requestId: assigned.id,
        riderId: rider.id,
        foodOrderId: assigned.foodOrderId,
        sellerId: assigned.sellerId,
        buyerId: assigned.buyerId,
        status: "ACCEPTED",
        deliveryFee: assigned.deliveryFee,
        distanceKm: assigned.distanceKm,
        estimatedMinutes: assigned.estimatedMinutes,
        acceptedAt: now,
        riderLatitude: rider.latitude,
        riderLongitude: rider.longitude,
        riderLocationAt: rider.lastLocationAt,
      },
    });
    await tx.riderProfile.update({ where: { id: rider.id }, data: { availability: "ON_DELIVERY" } });
    return { assigned, delivery };
  });

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: "DELIVERY_ASSIGNED",
      targetType: "DeliveryRequest",
      targetId: deliveryRequest.id,
      metadata: { rider: rider.user.name, deliveryId: result.delivery.id },
    }),
    notifyUser({
      userId: rider.user.id,
      type: "DELIVERY",
      title: "Delivery assigned to you",
      body: `${deliveryRequest.productName} has been assigned by admin.`,
      href: trackingUrl(result.delivery.id),
    }),
    notifyUser({
      userId: deliveryRequest.buyerId,
      type: "DELIVERY",
      title: "Rider assigned",
      body: `${rider.user.name || "A ShopLinkk rider"} is assigned to your delivery.`,
      href: trackingUrl(result.delivery.id),
    }),
    notifyUser({
      userId: deliveryRequest.sellerId,
      type: "DELIVERY",
      title: "Rider assigned",
      body: `${rider.user.name || "A ShopLinkk rider"} is assigned to ${deliveryRequest.productName}.`,
      href: trackingUrl(result.delivery.id),
    }),
  ]);

  return NextResponse.json(result);
}
