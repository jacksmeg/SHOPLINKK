import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, requireApiSession } from "@/lib/api";
import { auditLog } from "@/lib/notifications";
import { slugify } from "@/lib/slug";

const categorySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid category");
  }

  const { id } = await context.params;
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...parsed.data,
      slug: parsed.data.name ? slugify(parsed.data.name) : undefined,
    },
  });

  await auditLog({
    actorId: session.user.id,
    action: "CATEGORY_UPDATED",
    targetType: "Category",
    targetId: id,
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products) {
    return jsonError("Move or remove products before deleting this category");
  }

  await prisma.category.delete({ where: { id } });
  await auditLog({
    actorId: session.user.id,
    action: "CATEGORY_DELETED",
    targetType: "Category",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}

