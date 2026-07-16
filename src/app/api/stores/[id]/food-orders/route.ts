import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notifySellerOrderAlert } from "@/lib/notifications";
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
      status: "APPROVED",
      id: { in: parsed.data.items.map((item) => item.itemId) },
    },
    include: { options: true },
  });
  const byId = new Map(menuItems.map((item) => [item.id, item]));

  let total = 0;
  let estimatedDeliveryMinutes = 0;
  const orderItems = [];
  for (const item of parsed.data.items) {
    const menuItem = byId.get(item.itemId);
    if (!menuItem) return jsonError("One selected food item is not available.");
    const requestedOptions = item.options.length
      ? item.options
      : item.optionIds.map((optionId) => ({ optionId, quantity: 1 }));
    const optionById = new Map(menuItem.options.map((option) => [option.id, option]));
    const selectedOptions = requestedOptions.map((requestedOption) => {
      const option = optionById.get(requestedOption.optionId);
      if (!option) return null;
      const quantity = Math.max(1, Math.min(50, requestedOption.quantity));
      return {
        id: option.id,
        name: option.name,
        price: Number(option.price),
        quantity,
        lineTotal: Number(option.price) * quantity,
      };
    });
    if (selectedOptions.some((option) => option === null)) {
      return jsonError("One selected food add-on is not available.");
    }
    const cleanOptions = selectedOptions.filter((option): option is {
      id: string;
      name: string;
      price: number;
      quantity: number;
      lineTotal: number;
    } => option !== null);
    const unitPrice = Number(menuItem.basePrice);
    const optionTotal = cleanOptions.reduce((sum, option) => sum + option.lineTotal, 0);
    const lineTotal = unitPrice * item.quantity + optionTotal;
    estimatedDeliveryMinutes = Math.max(
      estimatedDeliveryMinutes,
      Number(menuItem.prepMinutes ?? 0) + Number(menuItem.deliveryMinutes ?? 0),
    );
    total += lineTotal;
    orderItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      options: cleanOptions,
    });
  }

  const order = await prisma.foodOrder.create({
    data: {
      storeId: store.id,
      buyerId: session.user.id,
      directPaymentStatus: parsed.data.paymentReference || parsed.data.paymentProofUrl || parsed.data.buyerPaymentNote
        ? "SUBMITTED"
        : "AWAITING_PAYMENT",
      buyerName: parsed.data.buyerName || session.user.name,
      buyerPhone: parsed.data.buyerPhone || session.user.phone,
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryNote: parsed.data.deliveryNote || null,
      paymentReference: parsed.data.paymentReference || null,
      paymentProofUrl: parsed.data.paymentProofUrl || null,
      buyerPaymentNote: parsed.data.buyerPaymentNote || null,
      paymentSubmittedAt: parsed.data.paymentReference || parsed.data.paymentProofUrl || parsed.data.buyerPaymentNote ? new Date() : null,
      estimatedDeliveryMinutes: estimatedDeliveryMinutes || null,
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

  await notifySellerOrderAlert({
    sellerId: store.ownerId,
    title: "New food order",
    body: `${session.user.name || "A buyer"} placed a food order from ${store.name}.`,
    href: "/seller/food/orders",
    buyerName: session.user.name,
    storeName: store.name,
    amount: total,
  });

  return NextResponse.json(order, { status: 201 });
}
