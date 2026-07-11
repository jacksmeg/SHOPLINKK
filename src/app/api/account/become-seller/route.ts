import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { uniqueSlug } from "@/lib/slug";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "account:become-seller", 3, 60 * 60 * 1000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["BUYER"]);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, phone: true, phoneVerifiedAt: true, location: true, store: { select: { id: true } } },
  });

  if (!user) return jsonError("Account not found", 404);
  if (!user.phone || !user.phoneVerifiedAt) {
    return jsonError("Verify your phone number before opening a seller account", 403);
  }

  if (user.store) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
    return NextResponse.json({ ok: true, message: "Your seller account is ready." });
  }

  const storeName = `${user.name?.trim() || "ShopLinkk"}'s Store`;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } }),
    prisma.store.create({
      data: {
        ownerId: user.id,
        name: storeName,
        slug: uniqueSlug(storeName),
        description: "New seller on ShopLinkk.",
        phone: user.phone,
        whatsapp: user.phone,
        location: user.location,
      },
    }),
  ]);

  await notifyUser({
    userId: user.id,
    type: "SECURITY",
    title: "Seller account created",
    body: "Your store is ready. Complete your profile and add your first listing.",
    href: "/seller",
  });

  return NextResponse.json({ ok: true, message: "Your seller account is ready." });
}
