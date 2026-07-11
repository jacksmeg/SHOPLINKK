import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  action: z.enum(["quote", "approve", "reject"]),
  days: z.number().int().min(1).max(90).default(7),
  feeAmount: z.number().min(0).nullable().optional(),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "WAIVED"]).default("PENDING"),
  feeReference: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid advert action");
  const advert = await prisma.productBoostRequest.findUnique({ where: { id: (await context.params).id }, include: { product: true } });
  if (!advert) return jsonError("Advert request not found", 404);
  if (advert.status !== "REQUESTED") return jsonError("This advert request has already been reviewed.", 409);

  const { action, days, feeAmount, paymentStatus, feeReference, note } = parsed.data;
  if (action !== "reject" && paymentStatus !== "WAIVED" && (feeAmount === null || feeAmount === undefined)) {
    return jsonError("Enter the advert fee or mark the fee as waived.");
  }
  if (action === "approve" && paymentStatus === "PENDING") {
    return jsonError("Confirm the offline fee or mark it waived before running the advert.");
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 86_400_000);
  if (action === "quote") {
    await prisma.$transaction([
      prisma.productBoostRequest.update({
        where: { id: advert.id },
        data: { durationDays: days, feeAmount, paymentStatus, feeReference: feeReference || null, note: note || advert.note, reviewedById: session.user.id, reviewedAt: now },
      }),
      prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: "BOOST_APPROVED", targetType: "ProductBoostRequestFee", targetId: advert.id, metadata: { productId: advert.productId, days, feeAmount, paymentStatus, quoteOnly: true } } }),
    ]);
    await notifyUser({
      userId: advert.sellerId,
      type: "BOOST",
      title: "Advert fee updated",
      body: paymentStatus === "WAIVED" ? `The fee for ${advert.product.title} was waived.` : `Admin set the ${days}-day advert fee at ${formatCurrency(feeAmount ?? 0)}.`,
      href: "/seller",
    });
    return NextResponse.json({ ok: true });
  }

  const approved = action === "approve";
  await prisma.$transaction([
    prisma.productBoostRequest.update({
      where: { id: advert.id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        durationDays: days,
        feeAmount,
        paymentStatus,
        feeReference: feeReference || null,
        reviewedById: session.user.id,
        reviewedAt: now,
        startsAt: approved ? now : null,
        endsAt: approved ? endsAt : null,
        note: note || advert.note,
      },
    }),
    ...(approved ? [prisma.product.update({ where: { id: advert.productId }, data: { isFeatured: true, featuredUntil: endsAt } })] : []),
    prisma.adminAuditLog.create({ data: { actorId: session.user.id, action: approved ? "BOOST_APPROVED" : "BOOST_REJECTED", targetType: "ProductBoostRequest", targetId: advert.id, metadata: { productId: advert.productId, days, feeAmount, paymentStatus, placement: advert.placement } } }),
  ]);
  await notifyUser({
    userId: advert.sellerId,
    type: "BOOST",
    title: approved ? "Homepage advert is live" : "Advert request not approved",
    body: approved ? `Your ${days}-day advert for ${advert.product.title} is now running.` : note || "Your advert request was reviewed.",
    href: "/seller",
  });
  return NextResponse.json({ ok: true });
}
