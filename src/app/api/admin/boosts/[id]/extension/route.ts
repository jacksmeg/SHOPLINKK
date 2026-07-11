import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  days: z.coerce.number().int().min(3).max(30).default(7),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid extension action");

  const { id } = await context.params;
  const advert = await prisma.productBoostRequest.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!advert) return jsonError("Advert request not found", 404);
  if (advert.extensionStatus !== "REQUESTED") {
    return jsonError("This advert extension has already been reviewed.", 409);
  }

  const { action, days, note } = parsed.data;
  const now = new Date();

  if (action === "reject") {
    await prisma.$transaction([
      prisma.productBoostRequest.update({
        where: { id: advert.id },
        data: {
          extensionStatus: "REJECTED",
          extensionNote: note || advert.extensionNote,
          extensionReviewedAt: now,
          reviewedById: session.user.id,
          reviewedAt: now,
        },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: session.user.id,
          action: "BOOST_REJECTED",
          targetType: "ProductBoostExtension",
          targetId: advert.id,
          metadata: { productId: advert.productId, days, note: note || null },
        },
      }),
    ]);
    await notifyUser({
      userId: advert.sellerId,
      type: "BOOST",
      title: "Advert extension not approved",
      body: note || "Admin reviewed your advert extension request.",
      href: "/seller/adverts",
    });
    return NextResponse.json({ ok: true });
  }

  const baseTime = advert.endsAt && advert.endsAt > now ? advert.endsAt : now;
  const endsAt = new Date(baseTime.getTime() + days * 86_400_000);

  await prisma.$transaction([
    prisma.productBoostRequest.update({
      where: { id: advert.id },
      data: {
        status: "APPROVED",
        extensionStatus: "APPROVED",
        extensionDays: days,
        extensionNote: note || advert.extensionNote,
        extensionReviewedAt: now,
        reviewedById: session.user.id,
        reviewedAt: now,
        endsAt,
        paymentStatus: advert.paymentStatus === "PENDING" ? "WAIVED" : advert.paymentStatus,
      },
    }),
    prisma.product.update({
      where: { id: advert.productId },
      data: { isFeatured: true, featuredUntil: endsAt },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: session.user.id,
        action: "BOOST_APPROVED",
        targetType: "ProductBoostExtension",
        targetId: advert.id,
        metadata: { productId: advert.productId, days, endsAt: endsAt.toISOString(), note: note || null },
      },
    }),
  ]);

  await notifyUser({
    userId: advert.sellerId,
    type: "BOOST",
    title: "Advert extension approved",
    body: `Your advert for ${advert.product.title} was extended by ${days} days.`,
    href: "/seller/adverts",
  });

  return NextResponse.json({ ok: true });
}
