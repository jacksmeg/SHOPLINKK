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
      category: parsed.data.category || null,
      basePrice: parsed.data.basePrice,
      imageUrl: parsed.data.imageUrls[0] || parsed.data.imageUrl || null,
      prepMinutes: parsed.data.prepMinutes === "" ? null : parsed.data.prepMinutes || null,
      deliveryMinutes: parsed.data.deliveryMinutes === "" ? null : parsed.data.deliveryMinutes || null,
      isSpicy: parsed.data.isSpicy,
      isVegetarian: parsed.data.isVegetarian,
      isAvailable: parsed.data.isAvailable,
      status: parsed.data.status,
      rejectionReason: null,
      approvedAt: null,
      images: parsed.data.imageUrls.length
        ? {
            create: parsed.data.imageUrls.map((url, sortOrder) => ({
              url,
              alt: parsed.data.name,
              sortOrder,
            })),
          }
        : parsed.data.imageUrl
          ? { create: [{ url: parsed.data.imageUrl, alt: parsed.data.name, sortOrder: 0 }] }
          : undefined,
      options: parsed.data.options.length
        ? {
            create: parsed.data.options.map((option) => ({
              name: option.name,
              price: option.price,
            })),
          }
        : undefined,
    },
    include: { options: true, images: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(item, { status: 201 });
}
