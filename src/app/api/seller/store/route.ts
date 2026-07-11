import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { slugify, uniqueSlug } from "@/lib/slug";
import { storeSchema } from "@/lib/validators";

export async function GET() {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
  });

  return NextResponse.json(store);
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = storeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid store data");
  }

  const existing = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
  });

  const store = await prisma.store.upsert({
    where: { ownerId: session.user.id },
    update: parsed.data,
    create: {
      ...parsed.data,
      ownerId: session.user.id,
      slug: uniqueSlug(slugify(parsed.data.name)),
    },
  });

  if (existing && existing.name !== parsed.data.name) {
    await prisma.store.update({
      where: { id: store.id },
      data: { slug: uniqueSlug(parsed.data.name) },
    });
  }

  return NextResponse.json(store);
}
