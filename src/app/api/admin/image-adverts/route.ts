import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { getAdminImageAdverts, saveAdminImageAdverts } from "@/lib/admin-adverts";
import type { AdminImageAdvert } from "@/lib/admin-advert-types";
import { prisma } from "@/lib/db";

const imageSchema = z.union([
  z.url(),
  z.string().regex(/^\/uploads\/.+/, "Upload the advert image first"),
  z.string().regex(/^\/marketing\/templates\/.+/, "Choose a valid ShopLinkk template"),
]);

const hrefSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || value.startsWith("/") || /^https?:\/\//.test(value), "Use a page path or a full https link");

const createSchema = z.object({
  headline: z.string().trim().max(90).optional().or(z.literal("")),
  imageUrl: imageSchema,
  href: hrefSchema,
  durationDays: z.coerce.number().int().min(1).max(90).default(7),
});

const updateSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the advert details");

  const now = new Date();
  const advert: AdminImageAdvert = {
    id: randomUUID(),
    headline: parsed.data.headline || "ShopLinkk advert",
    imageUrl: parsed.data.imageUrl,
    href: parsed.data.href || "",
    startsAt: now.toISOString(),
    endsAt: new Date(now.getTime() + parsed.data.durationDays * 86_400_000).toISOString(),
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdById: session.user.id,
  };

  const records = await getAdminImageAdverts();
  const nextRecords = [advert, ...records].slice(0, 30);
  await saveAdminImageAdverts(nextRecords, session.user.id);
  await prisma.adminAuditLog.create({
    data: { actorId: session.user.id, action: "BOOST_APPROVED", targetType: "AdminImageAdvert", targetId: advert.id, metadata: { headline: advert.headline, href: advert.href, endsAt: advert.endsAt } },
  }).catch(() => null);

  return NextResponse.json({ advert });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Choose the advert to update");

  const records = await getAdminImageAdverts();
  const now = new Date().toISOString();
  let found = false;
  const nextRecords = records.map((advert) => {
    if (advert.id !== parsed.data.id) return advert;
    found = true;
    return { ...advert, isActive: parsed.data.isActive ?? advert.isActive, updatedAt: now };
  });
  if (!found) return jsonError("Admin advert not found", 404);

  await saveAdminImageAdverts(nextRecords, session.user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose the advert to delete");

  const records = await getAdminImageAdverts();
  const nextRecords = records.filter((advert) => advert.id !== parsed.data.id);
  if (nextRecords.length === records.length) return jsonError("Admin advert not found", 404);

  await saveAdminImageAdverts(nextRecords, session.user.id);
  return NextResponse.json({ ok: true });
}
