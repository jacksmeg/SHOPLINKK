import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/notifications";
import { slugify } from "@/lib/slug";

const imageValue = z.union([
  z.url(),
  z.string().regex(/^\/uploads\/.+/, "Upload image first"),
]);

const foodCategorySchema = z.object({
  name: z.string().min(2, "Name the food category").optional(),
  slug: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(60).optional().or(z.literal("")),
  imageUrl: imageValue.optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = foodCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid food category");

  const { id } = await context.params;
  const data = parsed.data;
  const slug = data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined;

  try {
    const category = await prisma.foodCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.icon !== undefined ? { icon: data.icon || null } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await auditLog({
      actorId: session.user.id,
      action: "CATEGORY_UPDATED",
      targetType: "FoodCategory",
      targetId: id,
    });

    return NextResponse.json(category);
  } catch {
    return jsonError("Could not update this food category. The slug may already exist.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  try {
    await prisma.foodCategory.delete({ where: { id } });
    await auditLog({
      actorId: session.user.id,
      action: "CATEGORY_DELETED",
      targetType: "FoodCategory",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Could not delete this food category.");
  }
}
