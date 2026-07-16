import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["VERIFY", "UNVERIFY", "REJECT", "SUSPEND"]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose a store action.");

  const store = await prisma.store.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true } });
  if (!store) return jsonError("Store not found.", 404);

  const data =
    parsed.data.action === "VERIFY"
      ? { isVerified: true, verificationStatus: "VERIFIED" as const, trustScore: 90 }
      : parsed.data.action === "UNVERIFY"
        ? { isVerified: false, verificationStatus: "NOT_SUBMITTED" as const, trustScore: 50 }
        : parsed.data.action === "REJECT"
          ? { isVerified: false, verificationStatus: "REJECTED" as const, trustScore: 35 }
          : { isVerified: false, verificationStatus: "REJECTED" as const, vacationMode: true, acceptOrders: false, trustScore: 20 };

  const updated = await prisma.store.update({ where: { id }, data });
  await notifyUser({
    userId: store.ownerId,
    type: "SYSTEM",
    title: parsed.data.action === "VERIFY" ? "Store verified" : "Store status updated",
    body: parsed.data.note || `${store.name} was updated by ShopLinkk admin.`,
    href: "/seller/store",
  });

  return NextResponse.json({ store: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const store = await prisma.store.findUnique({ where: { id }, select: { id: true } });
  if (!store) return jsonError("Store not found.", 404);

  await prisma.store.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
