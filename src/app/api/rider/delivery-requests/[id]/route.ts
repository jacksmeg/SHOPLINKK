import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackingUrl } from "@/lib/delivery";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { riderDeliveryDecisionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["RIDER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = riderDeliveryDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose accept or reject");

  const profile = await prisma.riderProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, phone: true } } },
  });
  if (!profile) return jsonError("Complete your rider profile first", 404);
  if (profile.status !== "APPROVED") return jsonError("Admin must approve your rider account before accepting deliveries", 403);

  const deliveryRequest = await prisma.deliveryRequest.findUnique({ where: { id } });
  if (!deliveryRequest || deliveryRequest.status !== "OPEN") {
    return jsonError("This delivery request is no longer available", 409);
  }
  if (deliveryRequest.riderId && deliveryRequest.riderId !== profile.id) {
    return jsonError("This delivery was sent to another rider", 403);
  }

  if (parsed.data.action === "REJECT") {
    const rejected = await prisma.deliveryRequest.update({
      where: { id },
      data: { status: "REJECTED", riderId: profile.id, rejectedAt: new Date() },
    });
    return NextResponse.json({ deliveryRequest: rejected });
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const accepted = await tx.deliveryRequest.update({
      where: { id },
      data: { status: "ACCEPTED", riderId: profile.id, acceptedAt: now },
    });
    const delivery = await tx.delivery.create({
      data: {
        requestId: accepted.id,
        riderId: profile.id,
        foodOrderId: accepted.foodOrderId,
        sellerId: accepted.sellerId,
        buyerId: accepted.buyerId,
        status: "ACCEPTED",
        deliveryFee: accepted.deliveryFee,
        distanceKm: accepted.distanceKm,
        estimatedMinutes: accepted.estimatedMinutes,
        acceptedAt: now,
        riderLatitude: profile.latitude,
        riderLongitude: profile.longitude,
        riderLocationAt: profile.lastLocationAt,
      },
    });
    await tx.riderProfile.update({
      where: { id: profile.id },
      data: { availability: "ON_DELIVERY" },
    });
    return { accepted, delivery };
  });

  const href = trackingUrl(result.delivery.id);
  await Promise.all([
    notifyUser({
      userId: deliveryRequest.buyerId,
      type: "DELIVERY",
      title: "Rider accepted your delivery",
      body: `${profile.user.name || "A ShopLinkk rider"} is assigned to your order.`,
      href,
    }),
    notifyUser({
      userId: deliveryRequest.sellerId,
      type: "DELIVERY",
      title: "Rider accepted delivery",
      body: `${profile.user.name || "A ShopLinkk rider"} accepted ${deliveryRequest.productName}.`,
      href,
    }),
  ]);

  return NextResponse.json(result);
}
