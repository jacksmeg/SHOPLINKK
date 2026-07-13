import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { sellerId: true } });
  if (!product || (session.user.role !== "ADMIN" && product.sellerId !== session.user.id)) {
    return jsonError("Product not found or permission denied", 404);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      stockStatus: "AVAILABLE",
      listingStatus: session.user.role === "ADMIN" ? "APPROVED" : "PENDING",
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(updated);
}
