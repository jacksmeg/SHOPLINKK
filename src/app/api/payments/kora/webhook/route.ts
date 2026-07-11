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
  const config = await getIntegrationConfig("KORA");
  const secret = config.values.webhookSecret;
  const signature = request.headers.get("x-korapay-signature") || request.headers.get("x-kora-signature");

  if (secret && signature) {
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    if (!safeCompare(signature, expected)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(raw) as {
    event?: string;
    data?: { reference?: string; transaction_reference?: string; status?: string };
  };
  const reference = payload.data?.reference || payload.data?.transaction_reference;
  const status = String(payload.data?.status ?? payload.event ?? "").toLowerCase();

  if (reference && ["success", "successful", "paid", "charge.success"].some((item) => status.includes(item))) {
    await completePayment(reference, { rawPayload: payload }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
