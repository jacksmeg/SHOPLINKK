import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { getPublicProducts } from "@/lib/marketplace";
import { scanListingText } from "@/lib/moderation";
import { notifyUser } from "@/lib/notifications";
import { uniqueSlug } from "@/lib/slug";
import { productFilterSchema, productSchema } from "@/lib/validators";
import { getPlatformConfig } from "@/lib/platform-settings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = productFilterSchema.safeParse(Object.fromEntries(url.searchParams));

  const products = await getPublicProducts(parsed.success ? parsed.data : undefined);
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "products:create", 20, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid product data");
  }

  const store = await prisma.store.findUnique({
    where: { ownerId: session.user.id },
  });
  const platform = await getPlatformConfig();
  if (parsed.data.imageUrls.length > platform.maxProductImages) return jsonError(`You can upload up to ${platform.maxProductImages} product images`);
  if (platform.requirePhoneVerification && session.user.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phoneVerifiedAt: true } });
    if (!user?.phoneVerifiedAt) return jsonError("Verify your phone number before publishing a listing", 403);
  }
  const requestedStatus = parsed.data.listingStatus ?? "PENDING";
  const listingStatus =
    requestedStatus === "DRAFT"
      ? "DRAFT"
        : session.user.role === "ADMIN"
        ? requestedStatus
        : platform.listingApproval
          ? "PENDING"
          : "APPROVED";
  const scan = scanListingText(`${parsed.data.title} ${parsed.data.description} ${parsed.data.pickupNote ?? ""}`);

  const finalListingStatus = scan.flagged && listingStatus === "APPROVED" ? "PENDING" : listingStatus;
  const product = await prisma.product.create({
    data: {
      sellerId: session.user.id,
      storeId: store?.id,
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      slug: uniqueSlug(parsed.data.title),
      description: parsed.data.description,
      price: parsed.data.price,
      condition: parsed.data.condition,
      location: parsed.data.location,
      area: parsed.data.area || null,
      pickupNote: parsed.data.pickupNote || null,
      stockStatus: parsed.data.stockStatus,
      listingStatus: finalListingStatus,
      approvalNote: scan.flagged
        ? `Auto-flagged for admin review: ${scan.matches.join(", ")}`
        : null,
      negotiable: parsed.data.negotiable,
      allowCalls: parsed.data.allowCalls,
      allowWhatsapp: parsed.data.allowWhatsapp,
      videoUrl: parsed.data.videoUrl || null,
      seoTitle: parsed.data.seoTitle || parsed.data.title,
      seoDescription: parsed.data.seoDescription || parsed.data.description.slice(0, 155),
      expiresAt: finalListingStatus === "DRAFT" ? null : new Date(Date.now() + platform.listingExpiryDays * 24 * 60 * 60 * 1000),
      images: {
        create: parsed.data.imageUrls.map((url, index) => ({
          url,
          sortOrder: index,
          alt: parsed.data.title,
        })),
      },
    },
  });

  if (finalListingStatus === "PENDING") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          type: "LISTING",
          title: "Listing waiting for approval",
          body: `${parsed.data.title} needs review before it appears in the marketplace.`,
          href: "/admin/products",
        }),
      ),
    );
  }

  return NextResponse.json(product, { status: 201 });
}
