import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { priceAlertSchema } from "@/lib/validators";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    alerts.map((alert) => ({
      ...alert,
      targetPrice: alert.targetPrice ? Number(alert.targetPrice) : null,
      lastSeenPrice: alert.lastSeenPrice ? Number(alert.lastSeenPrice) : null,
      product: { ...alert.product, price: Number(alert.product.price) },
    })),
  );
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "price-alerts:upsert", 30, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = priceAlertSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid price alert");
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, sellerId: true, price: true },
  });

  if (!product || product.sellerId === session.user.id) {
    return jsonError("You cannot set an alert for this product", 400);
  }

  const alert = await prisma.priceAlert.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: product.id,
      },
    },
    update: {
      targetPrice: parsed.data.targetPrice,
      lastSeenPrice: product.price,
      status: "ACTIVE",
      triggeredAt: null,
    },
    create: {
      userId: session.user.id,
      productId: product.id,
      targetPrice: parsed.data.targetPrice,
      lastSeenPrice: product.price,
    },
  });

  return NextResponse.json(alert);
}

export async function DELETE(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return jsonError("Missing product");
  }

  await prisma.priceAlert.updateMany({
    where: { userId: session.user.id, productId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
