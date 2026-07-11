import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (secret && provided !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: {
      status: "ACTIVE",
      targetPrice: { not: null },
      product: {
        listingStatus: "APPROVED",
        stockStatus: { not: "SOLD" },
      },
    },
    include: {
      user: { select: { id: true, email: true } },
      product: { select: { title: true, slug: true, price: true } },
    },
    take: 100,
  });

  const due = alerts.filter((alert) => alert.targetPrice && alert.product.price.lte(alert.targetPrice));

  await Promise.all(
    due.map(async (alert) => {
      const body = `${alert.product.title} is now ${formatCurrency(Number(alert.product.price))}.`;
      await Promise.all([
        prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            lastSeenPrice: alert.product.price,
            status: "TRIGGERED",
            triggeredAt: new Date(),
          },
        }),
        notifyUser({
          userId: alert.userId,
          type: "PRICE_ALERT",
          title: "Price alert reached",
          body,
          href: `/products/${alert.product.slug}`,
        }),
        alert.user.email
          ? sendEmail({
              to: alert.user.email,
              subject: "ShopLinkk price alert reached",
              text: `${body} Open: ${appUrl(`/products/${alert.product.slug}`)}`,
              html: `<p>${body}</p><p><a href="${appUrl(`/products/${alert.product.slug}`)}">View product</a></p>`,
            })
          : Promise.resolve(),
      ]);
    }),
  );

  return NextResponse.json({ checked: alerts.length, triggered: due.length });
}
