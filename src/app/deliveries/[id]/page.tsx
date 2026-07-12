import { notFound } from "next/navigation";
import { DeliveryLiveTracker } from "@/components/delivery/delivery-live-tracker";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DeliveryTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const delivery = await prisma.delivery.findFirst({
    where: {
      id,
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
        { rider: { userId: session.user.id } },
        ...(session.user.role === "ADMIN" ? [{}] : []),
      ],
    },
    select: { id: true, buyerId: true, sellerId: true, rider: { select: { userId: true } } },
  });
  if (!delivery) notFound();

  const viewerRole =
    session.user.role === "ADMIN"
      ? "ADMIN"
      : delivery.buyerId === session.user.id
        ? "BUYER"
        : delivery.sellerId === session.user.id
          ? "SELLER"
          : "RIDER";

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      <DeliveryLiveTracker deliveryId={delivery.id} viewerRole={viewerRole} />
    </main>
  );
}
