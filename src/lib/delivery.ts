import type { DeliveryStatus } from "@/generated/prisma/client";

export const deliveryStatusSteps: DeliveryStatus[] = [
  "WAITING_FOR_RIDER",
  "ACCEPTED",
  "HEADING_TO_SELLER",
  "ITEM_PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
];

export function deliveryStatusTimestamp(status: DeliveryStatus, now = new Date()) {
  if (status === "ACCEPTED") return { acceptedAt: now };
  if (status === "HEADING_TO_SELLER") return { headingToSellerAt: now };
  if (status === "ITEM_PICKED_UP") return { pickedUpAt: now };
  if (status === "ON_THE_WAY") return { onTheWayAt: now };
  if (status === "DELIVERED") return { deliveredAt: now };
  if (status === "CANCELLED") return { cancelledAt: now };
  return {};
}

export function haversineKm(
  origin?: { latitude?: number | null; longitude?: number | null },
  destination?: { latitude?: number | null; longitude?: number | null },
) {
  if (
    origin?.latitude === undefined ||
    origin.longitude === undefined ||
    destination?.latitude === undefined ||
    destination.longitude === undefined ||
    origin.latitude === null ||
    origin.longitude === null ||
    destination.latitude === null ||
    destination.longitude === null
  ) {
    return null;
  }

  const radius = 6371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = radians(destination.latitude - origin.latitude);
  const deltaLng = radians(destination.longitude - origin.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(destination.latitude)) *
      Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateMinutes(distanceKm?: number | null) {
  if (!distanceKm) return null;
  return Math.max(5, Math.round((distanceKm / 25) * 60));
}

export function trackingUrl(deliveryId: string) {
  return `/deliveries/${deliveryId}`;
}
