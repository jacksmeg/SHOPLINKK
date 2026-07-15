import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

const flashSaleSchema = z.object({
  salePrice: z.coerce.number().positive("Enter a valid flash sale price"),
  saleStartsAt: z.string().min(1, "Choose when the flash sale starts"),
  saleEndsAt: z.string().min(1, "Choose when the flash sale ends"),
});

function readDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = flashSaleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the flash sale details");

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      sellerId: true,
      listingType: true,
      priceMode: true,
      price: true,
    },
  });
  if (!product) return jsonError("Product not found", 404);
  if (product.listingType === "SERVICE") return jsonError("Flash sales are only for products, not services.");
  if (product.priceMode === "CONTACT") return jsonError("Flash sale needs a fixed product price.");

  const normalPrice = Number(product.price);
  if (parsed.data.salePrice >= normalPrice) {
    return jsonError("Flash sale price must be lower than the normal price.");
  }

  const startsAt = readDate(parsed.data.saleStartsAt);
  const endsAt = readDate(parsed.data.saleEndsAt);
  if (!startsAt || !endsAt) return jsonError("Choose valid flash sale dates.");
  if (endsAt <= startsAt) return jsonError("Flash sale end time must be after the start time.");

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      salePrice: parsed.data.salePrice,
      saleStartsAt: startsAt,
      saleEndsAt: endsAt,
    },
    select: {
      id: true,
      title: true,
      salePrice: true,
      saleStartsAt: true,
      saleEndsAt: true,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: session.user.id,
      action: "BOOST_APPROVED",
      targetType: "ProductFlashSale",
      targetId: product.id,
      metadata: {
        productTitle: product.title,
        salePrice: parsed.data.salePrice,
        saleStartsAt: startsAt.toISOString(),
        saleEndsAt: endsAt.toISOString(),
      },
    },
  }).catch(() => null);

  await notifyUser({
    userId: product.sellerId,
    type: "BOOST",
    title: "Flash sale updated",
    body: `${product.title} is now on flash sale at ${formatCurrency(parsed.data.salePrice)}.`,
    href: "/seller",
  }).catch(() => null);

  return NextResponse.json({
    product: {
      ...updated,
      salePrice: updated.salePrice ? Number(updated.salePrice) : null,
      saleStartsAt: updated.saleStartsAt?.toISOString() ?? null,
      saleEndsAt: updated.saleEndsAt?.toISOString() ?? null,
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, title: true, sellerId: true },
  });
  if (!product) return jsonError("Product not found", 404);

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      salePrice: null,
      saleStartsAt: null,
      saleEndsAt: null,
    },
    select: { id: true, title: true },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: session.user.id,
      action: "BOOST_REJECTED",
      targetType: "ProductFlashSale",
      targetId: product.id,
      metadata: { productTitle: product.title, removed: true },
    },
  }).catch(() => null);

  await notifyUser({
    userId: product.sellerId,
    type: "BOOST",
    title: "Flash sale removed",
    body: `Admin removed the flash sale for ${product.title}.`,
    href: "/seller",
  }).catch(() => null);

  return NextResponse.json({ product: updated });
}
