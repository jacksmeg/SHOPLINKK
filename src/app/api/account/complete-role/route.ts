import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { uniqueSlug } from "@/lib/slug";

const schema = z.object({
  role: z.enum(["BUYER", "SELLER", "RIDER"]),
  storeKind: z.enum(["GENERAL", "FOOD"]).optional().default("GENERAL"),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose a valid account type.");

  if (session.user.role === "ADMIN") {
    return NextResponse.json({ ok: true, role: "ADMIN" });
  }

  if (parsed.data.role === "BUYER") {
    return NextResponse.json({ ok: true, role: session.user.role });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      location: true,
      role: true,
      store: { select: { id: true } },
    },
  });

  if (!user) return jsonError("Account not found", 404);

  if (parsed.data.role === "RIDER") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: "RIDER", whatsapp: user.whatsapp || user.phone || null },
      }),
      prisma.riderProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, status: "DRAFT", availability: "OFFLINE" },
        update: {},
      }),
    ]);

    await notifyUser({
      userId: user.id,
      type: "SECURITY",
      title: "Rider account created",
      body: "Submit your rider documents and vehicle details for admin verification.",
      href: "/rider/profile",
    });

    return NextResponse.json({ ok: true, role: "RIDER" });
  }

  if (user.role !== "SELLER") {
    const storeName = `${user.name?.trim() || "ShopLinkk"}'s Store`;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: "SELLER", whatsapp: user.whatsapp || user.phone || null },
      }),
      ...(user.store
        ? []
        : [
            prisma.store.create({
              data: {
                ownerId: user.id,
                name: storeName,
                slug: uniqueSlug(storeName),
                kind: parsed.data.storeKind === "FOOD" ? "FOOD" : "GENERAL",
                description: parsed.data.storeKind === "FOOD" ? "New food seller on ShopLinkk." : "New seller on ShopLinkk.",
                phone: user.phone,
                whatsapp: user.whatsapp || user.phone,
                momoNumber: parsed.data.storeKind === "FOOD" ? user.phone : null,
                location: user.location || "Dunkwa-on-Offin",
              },
            }),
          ]),
    ]);

    await notifyUser({
      userId: user.id,
      type: "SECURITY",
      title: "Seller account created",
      body: "Your store is ready. Complete your profile and add your first listing.",
      href: "/seller",
    });
  }

  return NextResponse.json({ ok: true, role: "SELLER" });
}
