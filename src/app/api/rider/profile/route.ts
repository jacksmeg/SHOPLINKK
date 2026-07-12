import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { formatGhanaPhone } from "@/lib/ghana";
import { riderApplicationSchema } from "@/lib/validators";

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const profile = await prisma.riderProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      ratings: { select: { rating: true } },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { buyer: { select: { name: true } }, seller: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = riderApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Check the rider application and try again");
  }

  const data = parsed.data;
  const profile = await prisma.riderProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      status: "PENDING",
      availability: "OFFLINE",
      profilePhotoUrl: data.profilePhotoUrl || null,
      ghanaCardUrl: data.ghanaCardUrl || null,
      licenseUrl: data.licenseUrl || null,
      vehicleDocumentUrl: data.vehicleDocumentUrl || null,
      vehicleType: data.vehicleType,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: formatGhanaPhone(data.emergencyContactPhone),
      momoName: data.momoName || null,
      momoNumber: data.momoNumber ? formatGhanaPhone(data.momoNumber) : null,
      bankName: data.bankName || null,
      bankAccountName: data.bankAccountName || null,
      bankAccountNumber: data.bankAccountNumber || null,
    },
    update: {
      status: "PENDING",
      rejectionReason: null,
      suspensionReason: null,
      profilePhotoUrl: data.profilePhotoUrl || null,
      ghanaCardUrl: data.ghanaCardUrl || null,
      licenseUrl: data.licenseUrl || null,
      vehicleDocumentUrl: data.vehicleDocumentUrl || null,
      vehicleType: data.vehicleType,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: formatGhanaPhone(data.emergencyContactPhone),
      momoName: data.momoName || null,
      momoNumber: data.momoNumber ? formatGhanaPhone(data.momoNumber) : null,
      bankName: data.bankName || null,
      bankAccountName: data.bankAccountName || null,
      bankAccountNumber: data.bankAccountNumber || null,
    },
  });

  if (session.user.role !== "ADMIN") {
    await prisma.user.update({ where: { id: session.user.id }, data: { role: "RIDER" } });
  }

  return NextResponse.json({ profile });
}
