import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const requestSchema = z.object({
  kind: z.enum(["marketplace", "food"]),
  orderId: z.string().min(1).max(100),
  reason: z.string().trim().min(5).max(1000),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a reason between 5 and 1,000 characters.");
  const { kind, orderId, reason } = parsed.data;
  const buyerId = session.user.id;
  const where = { id: orderId, buyerId };
  const order = kind === "marketplace"
    ? await prisma.marketplaceOrder.findFirst({ where })
    : await prisma.foodOrder.findFirst({ where, include: { store: { select: { ownerId: true } } } });

  if (!order) return jsonError("Order not found.", 404);
  if (order.status !== "DELIVERED" && !(order.status === "CANCELLED" && order.paymentConfirmedAt)) {
    return jsonError("Returns are available for delivered orders or cancelled orders with confirmed payment.", 409);
  }

  const sellerId = "sellerId" in order ? order.sellerId : order.store.ownerId;
  const created = await prisma.orderReturn.createMany({
    data: { orderKind: kind, orderId, buyerId, sellerId, reason, orderAmount: order.totalAmount },
    skipDuplicates: true,
  });
  if (created.count) {
    await notifyUser({ userId: sellerId, type: "SYSTEM", title: "New return request", body: "A buyer requested a return or refund.", href: "/seller/returns" }).catch(() => null);
  }
  return NextResponse.json({ ok: true }, { status: created.count ? 201 : 200 });
}
