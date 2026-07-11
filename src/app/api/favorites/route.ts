import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          store: true,
          seller: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const productId = body?.productId;

  if (!productId) {
    return jsonError("Product is required");
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
    update: {
      folderId: body?.folderId || undefined,
    },
    create: {
      userId: session.user.id,
      productId,
      folderId: body?.folderId || undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
