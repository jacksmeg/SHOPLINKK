import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { uniqueSlug } from "@/lib/slug";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const product = await prisma.product.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!product) {
    return jsonError("Product not found", 404);
  }

  const copy = await prisma.product.create({
    data: {
      sellerId: product.sellerId,
      storeId: product.storeId,
      categoryId: product.categoryId,
      listingType: product.listingType,
      title: `${product.title} copy`,
      slug: uniqueSlug(`${product.title} copy`),
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      saleStartsAt: product.saleStartsAt,
      saleEndsAt: product.saleEndsAt,
      quantity: product.quantity,
      condition: product.condition,
      location: product.location,
      area: product.area,
      pickupNote: product.pickupNote,
      stockStatus: "AVAILABLE",
      listingStatus: "DRAFT",
      negotiable: product.negotiable,
      allowCalls: product.allowCalls,
      allowWhatsapp: product.allowWhatsapp,
      videoUrl: product.videoUrl,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: {
        create: product.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder,
        })),
      },
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
