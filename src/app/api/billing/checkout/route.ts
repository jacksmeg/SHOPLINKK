import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { createCheckout } from "@/lib/billing";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "billing:checkout", 20, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession(["SELLER", "ADMIN"]);
  if (error) return error;

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid checkout request");

  try {
    const checkout = await createCheckout({
      userId: session.user.id,
      packageId: parsed.data.packageId,
      productId: parsed.data.productId,
      boostRequestId: parsed.data.boostRequestId,
      provider: parsed.data.provider,
    });
    return NextResponse.json(checkout);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Checkout could not be started.", 502);
  }
}
