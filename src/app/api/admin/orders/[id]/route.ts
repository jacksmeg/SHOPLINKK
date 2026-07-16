import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const type = new URL(request.url).searchParams.get("type") ?? "food";

  if (type === "marketplace") {
    const order = await prisma.marketplaceOrder.findUnique({ where: { id }, select: { id: true } });
    if (!order) return jsonError("Marketplace order not found.", 404);
    await prisma.marketplaceOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const order = await prisma.foodOrder.findUnique({ where: { id }, select: { id: true } });
  if (!order) return jsonError("Food order not found.", 404);
  await prisma.foodOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
