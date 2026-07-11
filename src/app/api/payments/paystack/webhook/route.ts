import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { completePayment } from "@/lib/billing";
import { getIntegrationConfig } from "@/lib/integration-settings";

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const config = await getIntegrationConfig("PAYSTACK");
  const secret = config.values.webhookSecret || config.values.secretKey;
  const signature = request.headers.get("x-paystack-signature");

  if (secret && signature) {
    const expected = createHmac("sha512", secret).update(raw).digest("hex");
    if (!safeCompare(signature, expected)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(raw) as { event?: string; data?: { reference?: string; status?: string } };
  const reference = payload.data?.reference;
  if (payload.event === "charge.success" && reference) {
    await completePayment(reference, { rawPayload: payload }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
