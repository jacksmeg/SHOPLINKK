import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { auditLog, notifyUser } from "@/lib/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" && body.reason.trim()
    ? body.reason.trim()
    : "Please improve the listing details and resubmit.";

  if (reason.length > 500) {
    return jsonError("Reason is too long");
  }

  const { id } = await context.params;
  const product = await prisma.product.update({
    where: { id },
    data: {
      listingStatus: "REJECTED",
      rejectionReason: reason,
    },
    select: { id: true, title: true, sellerId: true },
  });

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: "PRODUCT_REJECTED",
      targetType: "Product",
      targetId: product.id,
      metadata: { title: product.title, reason },
    }),
    notifyUser({
      userId: product.sellerId,
      type: "LISTING",
      title: "Listing needs changes",
      body: `${product.title} was not approved yet. Reason: ${reason}`,
      href: "/seller",
    }),
  ]);

  return NextResponse.json(product);
}
