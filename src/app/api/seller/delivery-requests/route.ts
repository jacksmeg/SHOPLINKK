import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { haversineKm, estimateMinutes } from "@/lib/delivery";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { deliveryRequestSchema } from "@/lib/validators";

function optionalNumber(value: number | "" | undefined | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type FoodOrderForDelivery = Prisma.FoodOrderGetPayload<{
  include: {
    buyer: { select: { id: true; name: true; phone: true } };
    items: true;
  };
}>;

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = deliveryRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the delivery request");

  const store = await prisma.store.findFirst({
    where: session.user.role === "ADMIN" ? { id: body?.storeId } : { ownerId: session.user.id },
    include: { owner: { select: { id: true, name: true, phone: true } } },
  });
  if (!store) return jsonError("Set up your store before requesting delivery", 404);

  let foodOrder: FoodOrderForDelivery | null = null;

  if (parsed.data.foodOrderId) {
    foodOrder = await prisma.foodOrder.findFirst({
      where: { id: parsed.data.foodOrderId, storeId: store.id },
      include: { buyer: { select: { id: true, name: true, phone: true } }, items: true },
    });
    if (!foodOrder) return jsonError("Food order was not found for this store", 404);

    const existing = await prisma.deliveryRequest.findFirst({
      where: {
        foodOrderId: foodOrder.id,
        status: { in: ["OPEN", "ACCEPTED"] },
      },
    });
    if (existing) return jsonError("A delivery request is already active for this order", 409);
  }

  const pickupLatitude = optionalNumber(parsed.data.pickupLatitude);
  const pickupLongitude = optionalNumber(parsed.data.pickupLongitude);
  const deliveryLatitude = optionalNumber(parsed.data.deliveryLatitude);
  const deliveryLongitude = optionalNumber(parsed.data.deliveryLongitude);
  const calculatedDistance = haversineKm(
    pickupLatitude !== null && pickupLongitude !== null ? { latitude: pickupLatitude, longitude: pickupLongitude } : undefined,
    deliveryLatitude !== null && deliveryLongitude !== null ? { latitude: deliveryLatitude, longitude: deliveryLongitude } : undefined,
  );
  const distanceKm = optionalNumber(parsed.data.distanceKm) ?? calculatedDistance;
  const minutes = optionalNumber(parsed.data.estimatedMinutes) ?? estimateMinutes(distanceKm);
  const productName = foodOrder
    ? foodOrder.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")
    : parsed.data.productName;
  const selectedRider = parsed.data.riderId
    ? await prisma.riderProfile.findFirst({
        where: { id: parsed.data.riderId, status: "APPROVED", availability: "ONLINE" },
        select: { id: true, userId: true },
      })
    : null;
  if (parsed.data.riderId && !selectedRider) return jsonError("That rider is not available right now.", 404);

  const deliveryRequest = await prisma.deliveryRequest.create({
    data: {
      foodOrderId: foodOrder?.id ?? null,
      storeId: store.id,
      sellerId: store.ownerId,
      buyerId: foodOrder?.buyerId ?? session.user.id,
      riderId: selectedRider?.id ?? null,
      pickupName: store.name,
      pickupPhone: store.phone || store.owner.phone,
      pickupAddress: parsed.data.pickupAddress || store.address || store.location,
      pickupLatitude,
      pickupLongitude,
      deliveryName: foodOrder?.buyerName || foodOrder?.buyer.name || null,
      deliveryPhone: foodOrder?.buyerPhone || foodOrder?.buyer.phone || null,
      deliveryAddress: foodOrder?.deliveryAddress || parsed.data.deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      productName,
      deliveryFee: parsed.data.deliveryFee,
      distanceKm,
      estimatedMinutes: minutes,
      note: parsed.data.note || foodOrder?.deliveryNote || null,
    },
  });

  const riders = await prisma.riderProfile.findMany({
    where: selectedRider
      ? { id: selectedRider.id }
      : { status: "APPROVED", availability: "ONLINE" },
    select: { userId: true },
    take: 25,
  });

  await Promise.all(
    riders.map((rider) =>
      notifyUser({
        userId: rider.userId,
        type: "DELIVERY",
        title: "New delivery available",
        body: `${productName} from ${store.name}`,
        href: "/rider/requests",
      }),
    ),
  );

  return NextResponse.json({ deliveryRequest });
}
