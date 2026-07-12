import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { foodMenuItemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const parsed = foodMenuItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the food item details.");

  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, kind: true },
  });
  if (!store) return jsonError("Create your store before adding food items.", 404);
  if (store.kind !== "FOOD") return jsonError("Change your store type to Food seller before adding a food menu.", 409);

  const item = await prisma.foodMenuItem.create({
    data: {
      storeId: store.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      basePrice: parsed.data.basePrice,
      imageUrl: parsed.data.imageUrl || null,
      isAvailable: parsed.data.isAvailable,
      options: parsed.data.options.length
        ? {
            create: parsed.data.options.map((option) => ({
              name: option.name,
              price: option.price,
            })),
          }
        : undefined,
    },
    include: { options: true },
  });

  return NextResponse.json(item, { status: 201 });
}
