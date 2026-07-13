import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { scanListingText } from "@/lib/moderation";
import { auditLog, notifyUser } from "@/lib/notifications";
import { notifyPriceDrop } from "@/lib/price-alerts";
import { productSchema } from "@/lib/validators";
import { getPlatformConfig } from "@/lib/platform-settings";

async function getManageableProduct(productId: string, userId: string, role: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, price: true },
  });

  return product && (role === "ADMIN" || product.sellerId === userId) ? product : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = enforceRateLimit(request, "products:update", 40, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const existingProduct = await getManageableProduct(id, session.user.id, session.user.role);

  if (!existingProduct) {
    return jsonError("Product not found or permission denied", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid product data");
  }

  const { imageUrls, ...data } = parsed.data;
  if (imageUrls) {
    const platform = await getPlatformConfig();
    if (imageUrls.length > platform.maxProductImages) {
      return jsonError(`You can upload up to ${platform.maxProductImages} product images`);
    }
  }
  const requestedStatus = data.listingStatus;
  const nextListingStatus =
    session.user.role === "ADMIN"
      ? requestedStatus
      : requestedStatus === "DRAFT"
        ? "DRAFT"
        : "PENDING";
  const scan =
    data.title || data.description || data.pickupNote
      ? scanListingText(`${data.title ?? ""} ${data.description ?? ""} ${data.pickupNote ?? ""}`)
      : { flagged: false, matches: [] };

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      area: data.area || undefined,
      pickupNote: data.pickupNote || undefined,
      videoUrl: data.videoUrl || undefined,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || (data.description ? data.description.slice(0, 155) : undefined),
      listingStatus: nextListingStatus,
      approvalNote: scan.flagged
        ? `Auto-flagged for admin review: ${scan.matches.join(", ")}`
        : undefined,
      rejectionReason: session.user.role === "ADMIN" ? data.listingStatus === "REJECTED" ? undefined : undefined : null,
      expiresAt: nextListingStatus === "PENDING" ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : undefined,
      ...(imageUrls
        ? {
            images: {
              deleteMany: {},
              create: imageUrls.map((url, index) => ({ url, sortOrder: index, alt: data.title })),
            },
          }
        : {}),
    },
  });

  if (parsed.data.price && Number(existingProduct.price) !== Number(parsed.data.price)) {
    await prisma.productPriceHistory.create({
      data: {
        productId: id,
        oldPrice: existingProduct.price,
        newPrice: parsed.data.price,
      },
    });
    await notifyPriceDrop(id, Number(existingProduct.price), Number(parsed.data.price));
  }

  if (session.user.role !== "ADMIN" && product.listingStatus === "PENDING") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          type: "LISTING",
          title: "Updated listing needs review",
          body: `${product.title} was edited and is waiting for approval.`,
          href: "/admin/products",
        }),
      ),
    );
  }

  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const allowed = await getManageableProduct(id, session.user.id, session.user.role);

  if (!allowed) {
    return jsonError("Product not found or permission denied", 404);
  }

  if (session.user.role === "ADMIN") {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true, sellerId: true },
    });

    if (!product) {
      return jsonError("Product not found", 404);
    }

    await prisma.product.delete({ where: { id } });
    await Promise.all([
      auditLog({
        actorId: session.user.id,
        action: "PRODUCT_REMOVED",
        targetType: "Product",
        targetId: product.id,
        metadata: { title: product.title },
      }),
      notifyUser({
        userId: product.sellerId,
        type: "LISTING",
        title: "Listing deleted",
        body: `${product.title} was deleted by ShopLinkk moderation.`,
        href: "/seller",
      }),
    ]);

    return NextResponse.json({ ok: true, deleted: true });
  }

  await prisma.product.update({
    where: { id },
    data: { listingStatus: "REMOVED" },
  });

  return NextResponse.json({ ok: true });
}
