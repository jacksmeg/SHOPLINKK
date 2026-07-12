import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { foodOrderSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await context.params;
  const parsed = foodOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Check the food order.");

  const store = await prisma.store.findUnique({
    where: { id },
    select: { id: true, ownerId: true, name: true, kind: true },
  });
  if (!store || store.kind !== "FOOD") return jsonError("Food ordering is not available for this store.", 404);
  if (store.ownerId === session.user.id) return jsonError("You cannot order from your own food store.", 409);

  const menuItems = await prisma.foodMenuItem.findMany({
    where: {
      storeId: store.id,
      isAvailable: true,
      id: { in: parsed.data.items.map((item) => item.itemId) },
    },
    include: { options: true },
  });
  const byId = new Map(menuItems.map((item) => [item.id, item]));

  let total = 0;
  const orderItems = [];
  for (const item of parsed.data.items) {
    const menuItem = byId.get(item.itemId);
    if (!menuItem) return jsonError("One selected food item is not available.");
    const selectedOptions = menuItem.options.filter((option) => item.optionIds.includes(option.id));
    const optionTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price), 0);
    const unitPrice = Number(menuItem.basePrice) + optionTotal;
    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;
    orderItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      options: selectedOptions.map((option) => ({ id: option.id, name: option.name, price: Number(option.price) })),
    });
  }

  const order = await prisma.foodOrder.create({
    data: {
      storeId: store.id,
      buyerId: session.user.id,
      buyerName: parsed.data.buyerName || session.user.name,
      buyerPhone: parsed.data.buyerPhone || session.user.phone,
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryNote: parsed.data.deliveryNote || null,
      paymentReference: parsed.data.paymentReference || null,
      totalAmount: total,
      items: {
        create: orderItems.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          options: item.options,
        })),
      },
    },
    include: { items: true },
  });

  await notifyUser({
    userId: store.ownerId,
    type: "SYSTEM",
    title: "New food order",
    body: `${session.user.name || "A buyer"} placed a food order from ${store.name}.`,
    href: "/seller/food",
  });

  return NextResponse.json(order, { status: 201 });
}
