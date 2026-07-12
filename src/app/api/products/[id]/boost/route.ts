import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { boostRequestSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = enforceRateLimit(request, "boost:request", 10, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const { id } = await context.params;
  const parsed = boostRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).filter(Boolean).join(" ");
    return jsonError(details || "Check the advert request details");
  }
  const packageId = parsed.data.packageId?.trim();
  const advertPackage = packageId
    ? await prisma.billingPackage.findFirst({
        where: { id: packageId, type: "ADVERT", isActive: true },
      })
    : null;
  if (packageId && !advertPackage) {
    return jsonError("That advert package is not available anymore. Choose another package or let admin confirm the fee.");
  }
  const product = await prisma.product.findFirst({
    where: {
      id,
      sellerId: session.user.role === "ADMIN" ? undefined : session.user.id,
    },
    select: { id: true, title: true, sellerId: true, listingStatus: true, stockStatus: true },
  });

  if (!product) {
    return jsonError("Product not found", 404);
  }

  if (product.listingStatus !== "APPROVED" || product.stockStatus === "SOLD") {
    return jsonError("Only approved, available products can be advertised.", 409);
  }

  const existing = await prisma.productBoostRequest.findFirst({
    where: {
      productId: product.id,
      sellerId: product.sellerId,
      status: { in: ["REQUESTED", "APPROVED"] },
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
  });

  if (existing) {
    return jsonError(existing.status === "APPROVED" ? "This product already has an active advert." : "An advert request for this product is already waiting for admin review.", 409);
  }

  const requestBoost = await prisma.productBoostRequest.create({
    data: {
      productId: product.id,
      sellerId: product.sellerId,
      placement: parsed.data.placement,
      requestedFor: parsed.data.placement === "HOMEPAGE" ? "Animated homepage product advert" : "Featured marketplace placement",
      headline: parsed.data.headline,
      durationDays: advertPackage?.durationDays ?? parsed.data.durationDays,
      feeAmount: advertPackage?.price,
      billingPackageId: advertPackage?.id,
      note: parsed.data.note || null,
      paymentStatus: "PENDING",
      images: parsed.data.imageUrls.length ? { create: parsed.data.imageUrls.map((url, sortOrder) => ({ url, sortOrder })) } : undefined,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
        type: "BOOST",
        title: "Homepage advert request",
        body: `${product.title} was requested for a ${parsed.data.durationDays}-day advert.`,
        href: "/admin/boosts",
      }),
    ),
  );

  return NextResponse.json(requestBoost, { status: 201 });
}
