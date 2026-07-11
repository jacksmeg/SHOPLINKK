import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { getBillingConfig, saveBillingConfig } from "@/lib/billing";

export async function GET() {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  return NextResponse.json(await getBillingConfig());
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiSession(["ADMIN"]);
  if (error) return error;
  const body = await request.json().catch(() => null) as {
    activeProvider?: "PAYSTACK" | "KORA";
    autoApprovePaidListings?: boolean;
    autoRunPaidAdverts?: boolean;
  } | null;

  if (!body?.activeProvider || !["PAYSTACK", "KORA"].includes(body.activeProvider)) {
    return jsonError("Choose Paystack or Kora as the active provider.");
  }

  const saved = await saveBillingConfig({
    activeProvider: body.activeProvider,
    autoApprovePaidListings: Boolean(body.autoApprovePaidListings),
    autoRunPaidAdverts: Boolean(body.autoRunPaidAdverts),
  }, session.user.id);

  return NextResponse.json({ ok: true, value: saved.value });
}
