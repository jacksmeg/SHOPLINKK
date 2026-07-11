import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { scanListingText } from "@/lib/moderation";
import { notifyUser } from "@/lib/notifications";
import { uniqueSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

const bulkSchema = z.object({
  items: z.array(productSchema).min(1).max(50),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "products:bulk", 5, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid bulk upload");
  }

  const store = await prisma.store.findUnique({ where: { ownerId: session.user.id } });
  const created = [];

  for (const item of parsed.data.items) {
    const requestedStatus = item.listingStatus ?? "PENDING";
    const listingStatus =
      requestedStatus === "DRAFT"
        ? "DRAFT"
        : session.user.role === "ADMIN"
          ? requestedStatus
          : "PENDING";
    const scan = scanListingText(`${item.title} ${item.description} ${item.pickupNote ?? ""}`);

    created.push(
      await prisma.product.create({
        data: {
          sellerId: session.user.id,
          storeId: store?.id,
          categoryId: item.categoryId,
          listingType: item.listingType,
          title: item.title,
          slug: uniqueSlug(item.title),
          description: item.description,
          price: item.price,
          salePrice: item.salePrice,
          saleStartsAt: item.saleStartsAt,
          saleEndsAt: item.saleEndsAt,
          quantity: item.quantity,
          condition: item.condition,
          location: item.location,
          area: item.area || null,
          pickupNote: item.pickupNote || null,
          stockStatus: item.stockStatus,
          listingStatus,
          approvalNote: scan.flagged ? `Auto-flagged for admin review: ${scan.matches.join(", ")}` : null,
          negotiable: item.negotiable,
          allowCalls: item.allowCalls,
          allowWhatsapp: item.allowWhatsapp,
          videoUrl: item.videoUrl || null,
          seoTitle: item.seoTitle || item.title,
          seoDescription: item.seoDescription || item.description.slice(0, 155),
          expiresAt: listingStatus === "DRAFT" ? null : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          images: {
            create: item.imageUrls.map((url, index) => ({
              url,
              sortOrder: index,
              alt: item.title,
            })),
          },
        },
      }),
    );
  }

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "LISTING",
        title: "Bulk listings waiting for review",
        body: `${created.length} products were uploaded in bulk.`,
        href: "/admin/products",
      }),
    ),
  );

  return NextResponse.json({ created: created.length }, { status: 201 });
}
