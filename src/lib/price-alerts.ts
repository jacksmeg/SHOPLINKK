import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

export async function notifyPriceDrop(productId: string, oldPrice: number, newPrice: number) {
  if (newPrice >= oldPrice) {
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, slug: true },
  });

  if (!product) {
    return;
  }

  const alerts = await prisma.priceAlert.findMany({
    where: {
      productId,
      status: "ACTIVE",
      OR: [{ targetPrice: null }, { targetPrice: { gte: newPrice } }],
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  await Promise.all(
    alerts.map(async (alert) => {
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: {
          lastSeenPrice: newPrice,
          status: alert.targetPrice ? "TRIGGERED" : "ACTIVE",
          triggeredAt: alert.targetPrice ? new Date() : alert.triggeredAt,
        },
      });

      const body = `${product.title} dropped from ${formatCurrency(oldPrice)} to ${formatCurrency(newPrice)}.`;
      await Promise.all([
        notifyUser({
          userId: alert.userId,
          type: "PRICE_ALERT",
          title: "Price drop alert",
          body,
          href: `/products/${product.slug}`,
        }),
        alert.user.email
          ? sendEmail({
              to: alert.user.email,
              subject: "ShopLinkk price drop alert",
              text: `${body} Open: ${appUrl(`/products/${product.slug}`)}`,
              html: `<p>${body}</p><p><a href="${appUrl(`/products/${product.slug}`)}">View product</a></p>`,
            })
          : Promise.resolve(),
      ]);
    }),
  );
}
