import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

const imageValue = z.union([
  z.url(),
  z.string().regex(/^\/uploads\/.+/, "Upload image first"),
]);

const patchSchema = z.object({
  name: z.string().min(2, "Name the food item").optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  basePrice: z.coerce.number().positive("Enter the base price").optional(),
  imageUrl: imageValue.optional().or(z.literal("")),
  imageUrls: z.array(imageValue).max(8, "Upload 8 food photos or fewer").optional(),
  prepMinutes: z.coerce.number().int().min(1).max(240).optional().or(z.literal("")),
  deliveryMinutes: z.coerce.number().int().min(1).max(240).optional().or(z.literal("")),
  isSpicy: z.coerce.boolean().optional(),
  isVegetarian: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional(),
  options: z.array(z.object({ name: z.string().min(1).max(60), price: z.coerce.number().min(0) })).max(20).optional(),
  submitForApproval: z.coerce.boolean().optional(),
});

async function ownedItem(itemId: string, userId: string, role: string) {
  return prisma.foodMenuItem.findFirst({
    where: {
      id: itemId,
      store: role === "ADMIN" ? undefined : { ownerId: userId },
    },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;
  const { id } = await context.params;
  const item = await ownedItem(id, session.user.id, session.user.role);
  if (!item) return jsonError("Food item not found.", 404);

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the food item details.");
  const data = parsed.data;
  const shouldResetApproval = Boolean(
    data.name !== undefined ||
    data.description !== undefined ||
    data.category !== undefined ||
    data.basePrice !== undefined ||
    data.prepMinutes !== undefined ||
    data.deliveryMinutes !== undefined ||
    data.imageUrl !== undefined ||
    data.imageUrls !== undefined ||
    data.options !== undefined,
  );
  const imageUrls = data.imageUrls ?? [];

  const updated = await prisma.foodMenuItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.category !== undefined ? { category: data.category || null } : {}),
      ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
      ...(data.prepMinutes !== undefined ? { prepMinutes: data.prepMinutes === "" ? null : data.prepMinutes || null } : {}),
      ...(data.deliveryMinutes !== undefined ? { deliveryMinutes: data.deliveryMinutes === "" ? null : data.deliveryMinutes || null } : {}),
      ...(data.isSpicy !== undefined ? { isSpicy: data.isSpicy } : {}),
      ...(data.isVegetarian !== undefined ? { isVegetarian: data.isVegetarian } : {}),
      ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      ...(data.imageUrls !== undefined ? { imageUrl: imageUrls[0] ?? null } : data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(shouldResetApproval || data.submitForApproval
        ? { status: data.status === "DRAFT" && !data.submitForApproval ? "DRAFT" : "PENDING", rejectionReason: null, approvedAt: null }
        : {}),
      ...(data.imageUrls !== undefined
        ? {
            images: {
              deleteMany: {},
              create: imageUrls.map((url, sortOrder) => ({ url, alt: data.name, sortOrder })),
            },
          }
        : {}),
      ...(data.options
        ? {
            options: {
              deleteMany: {},
              create: data.options.map((option) => ({ name: option.name, price: option.price })),
            },
          }
        : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" } }, options: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;
  const { id } = await context.params;
  const item = await ownedItem(id, session.user.id, session.user.role);
  if (!item) return jsonError("Food item not found.", 404);
  await prisma.foodMenuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
