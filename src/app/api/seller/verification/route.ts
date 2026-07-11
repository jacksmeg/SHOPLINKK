import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { sellerVerificationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = sellerVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid verification request");
  }

  const store = await prisma.store.findUnique({ where: { ownerId: session.user.id } });
  const verification = await prisma.sellerVerification.create({
    data: {
      sellerId: session.user.id,
      storeId: store?.id,
      businessName: parsed.data.businessName,
      documentUrl: parsed.data.documentUrl || null,
      notes: parsed.data.notes,
      status: "PENDING",
    },
  });

  if (store) {
    await prisma.store.update({
      where: { id: store.id },
      data: { verificationStatus: "PENDING" },
    });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await Promise.all(admins.map((admin) =>
    notifyUser({
      userId: admin.id,
      type: "SYSTEM",
      title: "Seller verification request",
      body: `${parsed.data.businessName} requested verification.`,
      href: "/admin/users",
    }),
  ));

  return NextResponse.json(verification, { status: 201 });
}

