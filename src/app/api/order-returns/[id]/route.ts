import { NextResponse } from "next/server";
import { z } from "zod";
import type { OrderReturnStatus } from "@/generated/prisma/client";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "ESCALATED", "REFUNDED", "CLOSED"]),
  note: z.string().trim().max(1000).optional(),
  amount: z.number().positive().max(9999999999.99).optional(),
  reference: z.string().trim().max(120).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession();
  if (error) return error;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Check the return details.");

  const { id } = await params;
  const entry = await prisma.orderReturn.findUnique({ where: { id } });
  const actor = session.user.id;
  if (!entry || (session.user.role !== "ADMIN" && entry.buyerId !== actor && entry.sellerId !== actor)) {
    return jsonError("Return request not found.", 404);
  }

  const { status, note, amount, reference } = parsed.data;
  const buyerAction = actor === entry.buyerId && status === "ESCALATED"
    && (["REQUESTED", "APPROVED", "REJECTED"] as OrderReturnStatus[]).includes(entry.status);
  const sellerAction = actor === entry.sellerId && ((entry.status === "REQUESTED" && ["APPROVED", "REJECTED"].includes(status))
    || (entry.status === "APPROVED" && status === "REFUNDED"));
  const adminAction = session.user.role === "ADMIN" && entry.status === "ESCALATED" && ["REFUNDED", "CLOSED"].includes(status);
  if (!buyerAction && !sellerAction && !adminAction) return jsonError("This return cannot move to that status.", 409);
  if ((status === "REJECTED" || status === "CLOSED") && !note) return jsonError("Enter a reason for the decision.");
  if (status === "REFUNDED" && (!amount || !reference || amount > Number(entry.orderAmount) || Number(amount.toFixed(2)) !== amount)) {
    return jsonError("Enter the actual refund amount (up to the order total) and transaction reference.");
  }

  const updated = await prisma.orderReturn.updateMany({
    where: { id, status: entry.status },
    data: {
      status,
      sellerNote: sellerAction && note ? note : undefined,
      adminNote: adminAction && note ? note : undefined,
      refundAmount: status === "REFUNDED" ? amount : undefined,
      refundReference: status === "REFUNDED" ? reference : undefined,
    },
  });
  if (!updated.count) return jsonError("The return changed. Refresh and try again.", 409);

  const recipients = buyerAction || adminAction ? [{ userId: entry.sellerId, href: "/seller/returns" }] : [];
  if (!buyerAction) recipients.push({ userId: entry.buyerId, href: "/buyer/orders" });
  await Promise.allSettled(recipients.map((recipient) => notifyUser({
    ...recipient,
    type: "SYSTEM",
    title: "Return request updated",
    body: `Return status: ${status.toLowerCase()}.`,
  })));
  return NextResponse.json({ ok: true });
}
