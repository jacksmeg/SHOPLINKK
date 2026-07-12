import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { haversineKm, estimateMinutes } from "@/lib/delivery";
import { jsonError, requireApiSession } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
        { rider: { userId: session.user.id } },
        ...(session.user.role === "ADMIN" ? [{}] : []),
      ],
    },
    include: {
      request: true,
      rider: { include: { user: { select: { id: true, name: true, phone: true, image: true } }, ratings: { select: { rating: true } } } },
      buyer: { select: { name: true, phone: true } },
      seller: { select: { name: true, phone: true, store: { select: { name: true, phone: true, address: true, slug: true } } } },
    },
  });

  if (!delivery) return jsonError("Delivery not found", 404);

  const riderDistance = haversineKm(
    delivery.riderLatitude && delivery.riderLongitude
      ? { latitude: delivery.riderLatitude, longitude: delivery.riderLongitude }
      : undefined,
    delivery.status === "HEADING_TO_SELLER" || delivery.status === "ACCEPTED"
      ? { latitude: delivery.request.pickupLatitude, longitude: delivery.request.pickupLongitude }
      : { latitude: delivery.request.deliveryLatitude, longitude: delivery.request.deliveryLongitude },
  );
  const ratingAverage = delivery.rider.ratings.length
    ? delivery.rider.ratings.reduce((sum, item) => sum + item.rating, 0) / delivery.rider.ratings.length
    : null;

  return NextResponse.json({
    id: delivery.id,
    status: delivery.status,
    productName: delivery.request.productName,
    deliveryFee: Number(delivery.deliveryFee),
    distanceKm: delivery.distanceKm,
    estimatedMinutes: delivery.estimatedMinutes ?? estimateMinutes(riderDistance),
    riderDistanceKm: riderDistance,
    buyerConfirmedAt: delivery.buyerConfirmedAt,
    sellerConfirmedAt: delivery.sellerConfirmedAt,
    riderLocation: delivery.riderLatitude && delivery.riderLongitude
      ? {
          latitude: delivery.riderLatitude,
          longitude: delivery.riderLongitude,
          at: delivery.riderLocationAt,
        }
      : null,
    pickup: {
      name: delivery.request.pickupName,
      phone: delivery.request.pickupPhone,
      address: delivery.request.pickupAddress,
      latitude: delivery.request.pickupLatitude,
      longitude: delivery.request.pickupLongitude,
    },
    dropoff: {
      name: delivery.request.deliveryName,
      phone: delivery.request.deliveryPhone,
      address: delivery.request.deliveryAddress,
      latitude: delivery.request.deliveryLatitude,
      longitude: delivery.request.deliveryLongitude,
    },
    rider: {
      id: delivery.rider.id,
      name: delivery.rider.user.name,
      phone: delivery.rider.user.phone,
      image: delivery.rider.user.image || delivery.rider.profilePhotoUrl,
      vehicleType: delivery.rider.vehicleType,
      ratingAverage,
      ratingCount: delivery.rider.ratings.length,
    },
  });
}
