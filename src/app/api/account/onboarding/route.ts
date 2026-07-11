import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { formatGhanaPhone } from "@/lib/ghana";
import { notifyUser } from "@/lib/notifications";
import { slugify, uniqueSlug } from "@/lib/slug";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters for your username")
    .max(30, "Use 30 characters or fewer")
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers, and underscore"),
  password: z.string().min(8, "Use at least 8 characters").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^(\+233|0)?[235][0-9]{8}$/.test(value.replace(/[\s-]/g, "")), "Use a valid Ghana phone number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
});

export async function GET() {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, phone: true, passwordHash: true, role: true },
  });

  if (!user) return jsonError("Account not found", 404);

  return NextResponse.json({
    username: user.username,
    phone: user.phone,
    role: user.role,
    needsUsername: !user.username,
    needsPassword: !user.passwordHash,
  });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check your account setup details.");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, phone: true, whatsapp: true, location: true, passwordHash: true, role: true, store: { select: { id: true } } },
  });

  if (!user) return jsonError("Account not found", 404);
  if (!user.passwordHash && !parsed.data.password) return jsonError("Create a password before opening your dashboard.");

  const usernameOwner = await prisma.user.findUnique({ where: { username: parsed.data.username }, select: { id: true } });
  if (usernameOwner && usernameOwner.id !== user.id) return jsonError("That username is already taken.");

  const phone = parsed.data.phone ? formatGhanaPhone(parsed.data.phone) : user.phone;
  if (phone) {
    const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (phoneOwner && phoneOwner.id !== user.id) return jsonError("That phone number is already used by another account.");
  }

  const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined;
  const shouldBecomeSeller = parsed.data.role === "SELLER" && user.role !== "ADMIN";
  const storeName = `${user.name?.trim() || parsed.data.username}'s Store`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        username: parsed.data.username,
        ...(passwordHash ? { passwordHash } : {}),
        ...(phone ? { phone, whatsapp: user.whatsapp || phone } : {}),
        ...(shouldBecomeSeller ? { role: "SELLER" } : {}),
      },
    }),
    ...(shouldBecomeSeller && !user.store
      ? [
          prisma.store.create({
            data: {
              ownerId: user.id,
              name: storeName,
              slug: uniqueSlug(slugify(storeName || "seller-store")),
              description: "New seller on ShopLinkk.",
              phone,
              whatsapp: user.whatsapp || phone,
              location: user.location || "Dunkwa-on-Offin",
            },
          }),
        ]
      : []),
  ]);

  await notifyUser({
    userId: user.id,
    type: "SECURITY",
    title: "Account setup complete",
    body: shouldBecomeSeller ? "Your seller store is ready. Complete your profile and add your first listing." : "Your ShopLinkk account setup is complete.",
    href: shouldBecomeSeller ? "/seller" : "/buyer",
  });

  return NextResponse.json({ ok: true, role: shouldBecomeSeller ? "SELLER" : user.role });
}
