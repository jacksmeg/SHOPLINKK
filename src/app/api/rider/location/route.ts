import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { riderLocationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["RIDER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = riderLocationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Location could not be saved");

  const profile = await prisma.riderProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return jsonError("Complete your rider profile first", 404);
  if (profile.status !== "APPROVED") return jsonError("Admin must approve your rider account before sharing delivery location", 403);

  const activeDelivery = parsed.data.deliveryId
    ? await prisma.delivery.findFirst({ where: { id: parsed.data.deliveryId, riderId: profile.id } })
    : await prisma.delivery.findFirst({
        where: {
          riderId: profile.id,
          status: { in: ["ACCEPTED", "HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY"] },
        },
        orderBy: { updatedAt: "desc" },
      });

  const now = new Date();
  await prisma.$transaction([
    prisma.riderProfile.update({
      where: { id: profile.id },
      data: {
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        lastLocationAt: now,
      },
    }),
    ...(activeDelivery
      ? [
          prisma.delivery.update({
            where: { id: activeDelivery.id },
            data: {
              riderLatitude: parsed.data.latitude,
              riderLongitude: parsed.data.longitude,
              riderLocationAt: now,
            },
          }),
        ]
      : []),
    prisma.riderLocationPing.create({
      data: {
        riderId: profile.id,
        deliveryId: activeDelivery?.id ?? null,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        accuracy: parsed.data.accuracy ?? null,
        heading: parsed.data.heading ?? null,
        speed: parsed.data.speed ?? null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, deliveryId: activeDelivery?.id ?? null });
}
