import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const days = Math.max(3, Math.min(30, Number(body?.days ?? 7) || 7));
  const headline = typeof body?.headline === "string" && body.headline.trim()
    ? body.headline.trim().slice(0, 70)
    : null;
  const { id } = await context.params;
  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const product = await prisma.product.findFirst({
    where: {
      id,
      listingStatus: "APPROVED",
      stockStatus: { not: "SOLD" },
    },
    select: { id: true, title: true, sellerId: true },
  });

  if (!product) return jsonError("Only approved, available listings can be promoted.", 404);

  const existing = await prisma.productBoostRequest.findFirst({
    where: {
      productId: product.id,
      placement: "HOMEPAGE",
      status: "APPROVED",
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const advert = existing
    ? await prisma.productBoostRequest.update({
        where: { id: existing.id },
        data: {
          headline: headline ?? existing.headline,
          durationDays: days,
          paymentStatus: "WAIVED",
          startsAt: existing.startsAt ?? now,
          endsAt,
          note: "Admin promoted this listing from product management.",
          reviewedById: session.user.id,
          reviewedAt: now,
        },
      })
    : await prisma.productBoostRequest.create({
        data: {
          productId: product.id,
          sellerId: product.sellerId,
          status: "APPROVED",
          placement: "HOMEPAGE",
          requestedFor: "Admin homepage promotion",
          headline: headline ?? product.title,
          durationDays: days,
          paymentStatus: "WAIVED",
          startsAt: now,
          endsAt,
          note: "Admin promoted this listing from product management.",
          reviewedById: session.user.id,
          reviewedAt: now,
        },
      });

  await prisma.product.update({
    where: { id: product.id },
    data: { isFeatured: true, featuredUntil: endsAt },
  });

  await notifyUser({
    userId: product.sellerId,
    type: "BOOST",
    title: "Listing promoted",
    body: `${product.title} is now running as a ShopLinkk homepage advert.`,
    href: "/seller/adverts",
  });

  return NextResponse.json(advert);
}
