import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { riderRatingSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const parsed = riderRatingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a rating from 1 to 5");

  const delivery = await prisma.delivery.findFirst({
    where: { id, buyerId: session.user.id, status: "DELIVERED" },
    include: { rider: { select: { id: true, userId: true } }, request: { select: { productName: true } } },
  });
  if (!delivery) return jsonError("Only the buyer can rate a completed delivery", 403);

  const rating = await prisma.riderRating.upsert({
    where: { authorId_deliveryId: { authorId: session.user.id, deliveryId: delivery.id } },
    create: {
      deliveryId: delivery.id,
      riderId: delivery.rider.id,
      authorId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  await notifyUser({
    userId: delivery.rider.userId,
    type: "REVIEW",
    title: "New rider rating",
    body: `A buyer rated your delivery for ${delivery.request.productName}.`,
    href: "/rider",
  });

  return NextResponse.json({ rating });
}
