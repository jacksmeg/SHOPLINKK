import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const featured = body?.featured !== false;
  const { id } = await context.params;

  const product = await prisma.product.update({
    where: { id },
    data: {
      isFeatured: featured,
      featuredUntil: featured ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
    },
    select: { id: true, title: true, sellerId: true, isFeatured: true },
  });

  await notifyUser({
    userId: product.sellerId,
    type: "LISTING",
    title: featured ? "Listing featured" : "Listing unfeatured",
    body: featured ? `${product.title} is featured for buyers.` : `${product.title} is no longer featured.`,
    href: "/seller",
  });

  return NextResponse.json(product);
}

