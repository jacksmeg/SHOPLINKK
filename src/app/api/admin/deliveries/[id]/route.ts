import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const type = new URL(request.url).searchParams.get("type") ?? "delivery";

  if (type === "request") {
    const item = await prisma.deliveryRequest.findUnique({ where: { id }, select: { id: true } });
    if (!item) return jsonError("Delivery request not found.", 404);
    await prisma.deliveryRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const delivery = await prisma.delivery.findUnique({ where: { id }, select: { id: true } });
  if (!delivery) return jsonError("Delivery not found.", 404);
  await prisma.delivery.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
