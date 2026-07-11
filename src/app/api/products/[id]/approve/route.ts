import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api";
import { auditLog, notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const { id } = await context.params;
  const product = await prisma.product.update({
    where: { id },
    data: {
      listingStatus: "APPROVED",
      approvalNote: typeof body?.note === "string" ? body.note : "Approved for marketplace visibility.",
      rejectionReason: null,
      renewedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, title: true, sellerId: true },
  });

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: "PRODUCT_APPROVED",
      targetType: "Product",
      targetId: product.id,
      metadata: { title: product.title },
    }),
    notifyUser({
      userId: product.sellerId,
      type: "LISTING",
      title: "Listing approved",
      body: `${product.title} is now visible in the marketplace.`,
      href: "/seller",
    }),
  ]);

  return NextResponse.json(product);
}
