import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { jsonError, requireApiSession } from "@/lib/api";
import { deliveryReportSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const parsed = deliveryReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a report reason");

  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    include: { request: { select: { productName: true } } },
  });
  if (!delivery) return jsonError("Only the buyer or seller can report this delivery", 403);

  const report = await prisma.deliveryReport.create({
    data: {
      deliveryId: delivery.id,
      riderId: delivery.riderId,
      reporterId: session.user.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "REPORT",
        title: "Delivery report needs review",
        body: `${delivery.request.productName} was reported for ${parsed.data.reason.toLowerCase().replace(/_/g, " ")}.`,
        href: "/admin/deliveries",
      }),
    ),
  );

  return NextResponse.json({ report });
}
