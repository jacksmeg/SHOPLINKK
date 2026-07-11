import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { compareProductSchema } from "@/lib/validators";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const products = await prisma.comparedProduct.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          store: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    products.map((item) => ({
      ...item,
      product: { ...item.product, price: Number(item.product.price) },
    })),
  );
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "compare:add", 30, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = compareProductSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid product");
  }

  const count = await prisma.comparedProduct.count({ where: { userId: session.user.id } });
  if (count >= 4) {
    return jsonError("You can compare up to 4 products at a time", 400);
  }

  const item = await prisma.comparedProduct.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      productId: parsed.data.productId,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return jsonError("Missing product");
  }

  await prisma.comparedProduct.deleteMany({
    where: {
      userId: session.user.id,
      productId,
    },
  });

  return NextResponse.json({ ok: true });
}
