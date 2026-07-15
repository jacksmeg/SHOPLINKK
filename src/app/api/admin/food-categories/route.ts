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
  name: z.string().min(2, "Name the food category"),
  slug: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  icon: z.string().max(60).optional().or(z.literal("")),
  imageUrl: imageValue.optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(200),
  isActive: z.coerce.boolean().default(true),
});

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const parsed = foodCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid food category");

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  if (!slug) return jsonError("Enter a valid food category name.");

  try {
    const category = await prisma.foodCategory.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        icon: parsed.data.icon || null,
        imageUrl: parsed.data.imageUrl || null,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });

    await auditLog({
      actorId: session.user.id,
      action: "CATEGORY_CREATED",
      targetType: "FoodCategory",
      targetId: category.id,
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return jsonError("A food category with that name or slug already exists.");
  }
}
