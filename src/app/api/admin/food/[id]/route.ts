import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose approve or reject.");

  const { id } = await context.params;
  const item = await prisma.foodMenuItem.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true, ownerId: true } } },
  });

  if (!item) return jsonError("Food item not found.", 404);

  const updated = await prisma.foodMenuItem.update({
    where: { id },
    data: {
      status: parsed.data.status,
      rejectionReason: parsed.data.status === "REJECTED" ? parsed.data.reason || "Food menu item needs changes." : null,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
      isAvailable: parsed.data.status === "APPROVED" ? item.isAvailable : false,
    },
  });

  await notifyUser({
    userId: item.store.ownerId,
    type: "SYSTEM",
    title: parsed.data.status === "APPROVED" ? "Food item approved" : "Food item needs changes",
    body: parsed.data.status === "APPROVED"
      ? `${item.name} is now visible to buyers.`
      : `${item.name} was rejected. ${parsed.data.reason || "Please edit and submit again."}`,
    href: "/seller/food",
  }).catch(() => null);

  return NextResponse.json(updated);
}
