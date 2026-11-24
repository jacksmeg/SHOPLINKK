import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { directPaymentProofSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const parsed = directPaymentProofSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Add payment proof details.");
  }

  const order = await prisma.marketplaceOrder.findFirst({
    where: { id, buyerId: session.user.id },
    include: { store: { select: { name: true } }, seller: { select: { id: true } } },
  });
  if (!order) return jsonError("Marketplace order not found.", 404);
  if (!["PENDING_PAYMENT", "PAYMENT_SUBMITTED"].includes(order.status)) {
    return jsonError("This order can no longer receive payment updates.", 409);
  }
  if (!order.stockReserved && order.status !== "PAYMENT_SUBMITTED") {
    return jsonError("Wait for the seller to approve the order before paying.", 409);
  }

  const [updated] = await prisma.marketplaceOrder.updateManyAndReturn({
    where: { id, status: order.status, updatedAt: order.updatedAt },
    data: {
      directPaymentStatus: "SUBMITTED",
      status: order.status === "PENDING_PAYMENT" ? "PAYMENT_SUBMITTED" : order.status,
      paymentReference: parsed.data.paymentReference || order.paymentReference,
      paymentProofUrl: parsed.data.paymentProofUrl || order.paymentProofUrl,
      buyerPaymentNote: parsed.data.buyerPaymentNote || order.buyerPaymentNote,
      paymentSubmittedAt: new Date(),
    },
  });
  if (!updated) return jsonError("The order changed. Refresh and try again.", 409);

  await notifyUser({
    userId: order.seller.id,
    type: "SYSTEM",
    title: "Marketplace payment submitted",
    body: `${session.user.name || "A buyer"} submitted direct MoMo payment details for ${order.store?.name || "an order"}.`,
    href: "/seller/orders",
  });

  return NextResponse.json(updated);
}
