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
  const status = body?.verified === false ? "REJECTED" : "VERIFIED";
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  const { id } = await context.params;

  const store = await prisma.store.findUnique({
    where: { ownerId: id },
    select: { id: true, name: true },
  });

  if (!store) {
    return jsonError("Seller store not found", 404);
  }

  await prisma.$transaction([
    prisma.store.update({
      where: { id: store.id },
      data: {
        isVerified: status === "VERIFIED",
        verificationStatus: status,
        trustScore: status === "VERIFIED" ? 85 : 50,
      },
    }),
    prisma.sellerVerification.create({
      data: {
        sellerId: id,
        storeId: store.id,
        status,
        businessName: store.name,
        notes,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    }),
  ]);

  await Promise.all([
    auditLog({
      actorId: session.user.id,
      action: status === "VERIFIED" ? "SELLER_VERIFIED" : "SELLER_REJECTED",
      targetType: "User",
      targetId: id,
      metadata: { store: store.name, notes },
    }),
    notifyUser({
      userId: id,
      type: "SYSTEM",
      title: status === "VERIFIED" ? "Seller verified" : "Seller verification needs changes",
      body: notes || (status === "VERIFIED" ? "Your store now has a verified badge." : "Please update your store verification details."),
      href: "/seller",
    }),
  ]);

  return NextResponse.json({ ok: true, status });
}

