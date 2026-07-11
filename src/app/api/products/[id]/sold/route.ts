import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { sellerId: true, title: true } });

  if (!product || (session.user.role !== "ADMIN" && product.sellerId !== session.user.id)) {
    return jsonError("Product not found or permission denied", 404);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { stockStatus: "SOLD" },
  });

  await notifyUser({
    userId: product.sellerId,
    type: "LISTING",
    title: "Product marked sold",
    body: `${product.title} is now marked as sold.`,
    href: "/seller",
  });

  return NextResponse.json(updated);
}
