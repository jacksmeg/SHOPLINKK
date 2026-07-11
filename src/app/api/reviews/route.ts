import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { reviewSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid review");
  }

  if (parsed.data.sellerId === session.user.id) {
    return jsonError("You cannot review yourself");
  }

  const existing = await prisma.review.findFirst({
    where: {
      authorId: session.user.id,
      sellerId: parsed.data.sellerId,
      productId: parsed.data.productId ?? null,
    },
  });

  const review = existing
    ? await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      })
    : await prisma.review.create({
        data: {
          authorId: session.user.id,
          sellerId: parsed.data.sellerId,
          storeId: parsed.data.storeId,
          productId: parsed.data.productId,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      });

  const stats = await prisma.review.aggregate({
    where: { sellerId: parsed.data.sellerId },
    _avg: { rating: true },
    _count: true,
  });

  if (parsed.data.storeId) {
    await prisma.store.update({
      where: { id: parsed.data.storeId },
      data: {
        ratingAverage: stats._avg.rating ?? 0,
        ratingCount: stats._count,
        trustScore: Math.min(100, 50 + Math.round((stats._avg.rating ?? 0) * 10)),
      },
    });
  }

  await notifyUser({
    userId: parsed.data.sellerId,
    type: "REVIEW",
    title: "New seller review",
    body: `You received a ${parsed.data.rating}-star review.`,
    href: parsed.data.storeId ? "/seller" : "/notifications",
  });

  return NextResponse.json(review, { status: 201 });
}
