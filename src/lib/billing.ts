import { randomBytes } from "node:crypto";
import type { BillingProvider, PaymentPurpose, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { getIntegrationConfig } from "@/lib/integration-settings";
import { getPlatformConfig } from "@/lib/platform-settings";
import { notifyUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";

export type BillingConfig = {
  activeProvider: BillingProvider;
  autoApprovePaidListings: boolean;
  autoRunPaidAdverts: boolean;
};

export const defaultBillingConfig: BillingConfig = {
  activeProvider: "PAYSTACK",
  autoApprovePaidListings: true,
  autoRunPaidAdverts: true,
};

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : {};
}

export async function getBillingConfig(): Promise<BillingConfig> {
  const setting = await prisma.platformSetting.findUnique({ where: { key: "billing" } }).catch(() => null);
  return { ...defaultBillingConfig, ...(jsonObject(setting?.value) as Partial<BillingConfig>) };
}

export async function saveBillingConfig(config: BillingConfig, updatedById: string) {
  return prisma.platformSetting.upsert({
    where: { key: "billing" },
    update: { value: config as unknown as Prisma.InputJsonValue, updatedById },
    create: { key: "billing", value: config as unknown as Prisma.InputJsonValue, updatedById },
  });
}

function paymentReference() {
  return `SLK-${Date.now()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function amountInMinorUnit(amount: number) {
  return Math.round(amount * 100);
}

type CheckoutInput = {
  userId: string;
  packageId: string;
  productId?: string;
  boostRequestId?: string;
  provider?: BillingProvider;
};

export async function createCheckout(input: CheckoutInput) {
  const [billing, user, billingPackage] = await Promise.all([
    getBillingConfig(),
    prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, name: true, email: true, phone: true } }),
    prisma.billingPackage.findFirst({ where: { id: input.packageId, isActive: true } }),
  ]);

  if (!user) throw new Error("Your account could not be found.");
  if (!billingPackage) throw new Error("This billing package is not available.");

  const provider = input.provider ?? billing.activeProvider;
  const purpose: PaymentPurpose = billingPackage.type === "ADVERT" ? "ADVERT" : "PRODUCT_LISTING";

  if (purpose === "PRODUCT_LISTING") {
    if (!input.productId) throw new Error("Choose the product listing to pay for.");
    const product = await prisma.product.findFirst({
      where: { id: input.productId, sellerId: input.userId },
      select: { id: true, title: true },
    });
    if (!product) throw new Error("Product not found for this seller account.");
  }

  if (purpose === "ADVERT") {
    if (!input.boostRequestId) throw new Error("Choose the advert request to pay for.");
    const request = await prisma.productBoostRequest.findFirst({
      where: { id: input.boostRequestId, sellerId: input.userId },
      select: { id: true },
    });
    if (!request) throw new Error("Advert request not found for this seller account.");
  }

  const reference = paymentReference();
  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId: input.userId,
      packageId: billingPackage.id,
      provider,
      purpose,
      reference,
      amount: billingPackage.price,
      currency: billingPackage.currency,
      productId: purpose === "PRODUCT_LISTING" ? input.productId : null,
      boostRequestId: purpose === "ADVERT" ? input.boostRequestId : null,
    },
  });

  if (Number(billingPackage.price) <= 0) {
    await completePayment(reference, { trustedFreePackage: true });
    return { checkoutUrl: appUrl(`/billing/complete?reference=${encodeURIComponent(reference)}`), reference };
  }

  const checkoutUrl = await initializeProviderCheckout(provider, {
    reference,
    amount: Number(billingPackage.price),
    currency: billingPackage.currency,
    email: user.email ?? `${user.id}@shoplinkk.local`,
    name: user.name ?? "ShopLinkk seller",
    purpose,
    productId: input.productId,
    boostRequestId: input.boostRequestId,
  });

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { checkoutUrl },
  });

  return { checkoutUrl, reference };
}

async function initializeProviderCheckout(
  provider: BillingProvider,
  input: {
    reference: string;
    amount: number;
    currency: string;
    email: string;
    name: string;
    purpose: PaymentPurpose;
    productId?: string;
    boostRequestId?: string;
  },
) {
  if (provider === "PAYSTACK") {
    const config = await getIntegrationConfig("PAYSTACK");
    if (!config.enabled) throw new Error("Paystack is not connected in admin API connections.");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.values.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: amountInMinorUnit(input.amount),
        currency: input.currency,
        reference: input.reference,
        callback_url: appUrl(`/billing/complete?reference=${encodeURIComponent(input.reference)}`),
        metadata: {
          shoplinkk_reference: input.reference,
          purpose: input.purpose,
          productId: input.productId,
          boostRequestId: input.boostRequestId,
        },
      }),
    });
    const result = await response.json().catch(() => null) as { data?: { authorization_url?: string }; message?: string } | null;
    if (!response.ok || !result?.data?.authorization_url) {
      throw new Error(result?.message ?? "Paystack could not start checkout.");
    }
    return result.data.authorization_url;
  }

  const config = await getIntegrationConfig("KORA");
  if (!config.enabled) throw new Error("Kora is not connected in admin API connections.");
  const baseUrl = (config.values.baseUrl || "https://api.korapay.com/merchant/api/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/charges/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.values.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      redirect_url: appUrl(`/billing/complete?reference=${encodeURIComponent(input.reference)}`),
      customer: {
        name: input.name,
        email: input.email,
      },
      metadata: {
        shoplinkk_reference: input.reference,
        purpose: input.purpose,
        productId: input.productId,
        boostRequestId: input.boostRequestId,
      },
    }),
  });
  const result = await response.json().catch(() => null) as { data?: Record<string, string>; message?: string } | null;
  const checkoutUrl = result?.data?.checkout_url || result?.data?.payment_url || result?.data?.authorization_url;
  if (!response.ok || !checkoutUrl) {
    throw new Error(result?.message ?? "Kora could not start checkout.");
  }
  return checkoutUrl;
}

async function verifyProviderPayment(provider: BillingProvider, reference: string) {
  if (provider === "PAYSTACK") {
    const config = await getIntegrationConfig("PAYSTACK");
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${config.values.secretKey}` },
      cache: "no-store",
    });
    const result = await response.json().catch(() => null) as { data?: { status?: string; reference?: string }; message?: string } | null;
    return {
      ok: response.ok && result?.data?.status === "success",
      providerReference: result?.data?.reference,
      payload: result,
      message: result?.message,
    };
  }

  const config = await getIntegrationConfig("KORA");
  const baseUrl = (config.values.baseUrl || "https://api.korapay.com/merchant/api/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/charges/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.values.secretKey}` },
    cache: "no-store",
  });
  const result = await response.json().catch(() => null) as { data?: { status?: string; reference?: string }; message?: string } | null;
  const status = String(result?.data?.status ?? "").toLowerCase();
  return {
    ok: response.ok && ["success", "successful", "paid"].includes(status),
    providerReference: result?.data?.reference,
    payload: result,
    message: result?.message,
  };
}

export async function completePayment(reference: string, options?: { rawPayload?: unknown; trustedFreePackage?: boolean }) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { reference },
    include: {
      package: true,
      product: { select: { id: true, title: true, sellerId: true } },
      boostRequest: { include: { product: { select: { id: true, title: true } } } },
    },
  });

  if (!transaction) throw new Error("Payment reference was not found.");
  if (transaction.status === "SUCCESS") return transaction;

  const verified = options?.trustedFreePackage
    ? { ok: true, providerReference: reference, payload: options.rawPayload ?? { freePackage: true }, message: "Free package completed." }
    : await verifyProviderPayment(transaction.provider, reference);

  if (!verified.ok) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED", rawPayload: (verified.payload ?? options?.rawPayload ?? {}) as Prisma.InputJsonValue },
    });
    throw new Error(verified.message || "The payment has not been confirmed yet.");
  }

  const now = new Date();
  const billing = await getBillingConfig();
  const platform = await getPlatformConfig();
  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        providerReference: verified.providerReference,
        rawPayload: (verified.payload ?? options?.rawPayload ?? {}) as Prisma.InputJsonValue,
        paidAt: now,
      },
    }),
  ];

  if (transaction.purpose === "PRODUCT_LISTING" && transaction.productId && billing.autoApprovePaidListings) {
    updates.push(
      prisma.product.update({
        where: { id: transaction.productId },
        data: {
          listingPaymentStatus: "PAID",
          listingStatus: "APPROVED",
          approvalNote: `Auto-approved after ${formatCurrency(Number(transaction.amount))} listing payment.`,
          expiresAt: new Date(now.getTime() + platform.listingExpiryDays * 86_400_000),
        },
      }),
    );
  }

  if (transaction.purpose === "ADVERT" && transaction.boostRequestId && transaction.boostRequest && billing.autoRunPaidAdverts) {
    const days = transaction.package?.durationDays ?? transaction.boostRequest.durationDays;
    const endsAt = new Date(now.getTime() + days * 86_400_000);
    updates.push(
      prisma.productBoostRequest.update({
        where: { id: transaction.boostRequestId },
        data: {
          status: "APPROVED",
          paymentStatus: "CONFIRMED",
          feeAmount: transaction.amount,
          feeReference: reference,
          startsAt: now,
          endsAt,
          reviewedAt: now,
        },
      }),
      prisma.product.update({
        where: { id: transaction.boostRequest.productId },
        data: { isFeatured: true, featuredUntil: endsAt },
      }),
    );
  }

  await prisma.$transaction(updates);

  if (transaction.purpose === "PRODUCT_LISTING" && transaction.product) {
    await notifyUser({
      userId: transaction.product.sellerId,
      type: "LISTING",
      title: "Listing payment confirmed",
      body: `${transaction.product.title} is now approved after payment.`,
      href: "/seller",
    });
  }

  if (transaction.purpose === "ADVERT" && transaction.boostRequest) {
    await notifyUser({
      userId: transaction.boostRequest.sellerId,
      type: "BOOST",
      title: "Advert payment confirmed",
      body: `${transaction.boostRequest.product.title} is now running as a paid advert.`,
      href: "/seller/adverts",
    });
  }

  return prisma.paymentTransaction.findUniqueOrThrow({ where: { reference } });
}
