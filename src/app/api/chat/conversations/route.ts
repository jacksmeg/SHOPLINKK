import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      buyer: { select: { id: true, name: true, image: true } },
      seller: { select: { id: true, name: true, image: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: session.user.id },
              readAt: null,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const productId = String(body?.productId ?? "");
  const sellerId = String(body?.sellerId ?? "");

  if (!productId || !sellerId) {
    return jsonError("Product and seller are required");
  }

  if (sellerId === session.user.id) {
    return jsonError("You cannot chat with yourself about your own listing");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, listingStatus: true },
  });

  if (!product || product.listingStatus !== "APPROVED") {
    return jsonError("This product is not available for chat", 404);
  }

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      active: true,
      OR: [
        { blockedById: session.user.id, targetId: product.sellerId },
        { blockedById: product.sellerId, targetId: session.user.id },
      ],
    },
  });

  if (blocked) {
    return jsonError("This seller is not available for chat", 403);
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      productId_buyerId_sellerId: {
        productId,
        buyerId: session.user.id,
        sellerId: product.sellerId,
      },
    },
    update: {},
    create: {
      productId,
      buyerId: session.user.id,
      sellerId: product.sellerId,
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
