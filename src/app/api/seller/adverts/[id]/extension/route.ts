import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { advertExtensionSchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const parsed = advertExtensionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid advert extension request");

  const { id } = await context.params;
  const advert = await prisma.productBoostRequest.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { sellerId: session.user.id }),
    },
    include: { product: true },
  });

  if (!advert) return jsonError("Advert request not found", 404);
  if (advert.status !== "APPROVED" && advert.status !== "ENDED") {
    return jsonError("Only approved adverts can be extended.");
  }
  if (advert.extensionStatus === "REQUESTED") {
    return jsonError("An extension request is already waiting for admin review.", 409);
  }

  const now = new Date();
  await prisma.productBoostRequest.update({
    where: { id: advert.id },
    data: {
      extensionStatus: "REQUESTED",
      extensionDays: parsed.data.days,
      extensionNote: parsed.data.note || null,
      extensionRequestedAt: now,
      extensionReviewedAt: null,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isBlocked: false },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "BOOST",
        title: "Advert extension requested",
        body: `${session.user.name ?? session.user.email ?? "A seller"} asked to extend ${advert.product.title}.`,
        href: "/admin/boosts",
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
