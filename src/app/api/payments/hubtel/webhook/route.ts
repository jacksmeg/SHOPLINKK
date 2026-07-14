import { NextResponse } from "next/server";
import { completePayment } from "@/lib/billing";
import { getIntegrationConfig } from "@/lib/integration-settings";

function readString(value: unknown, paths: string[][]) {
  for (const path of paths) {
    let current: unknown = value;
    for (const part of path) {
      if (!current || typeof current !== "object" || !(part in current)) {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }
    if (typeof current === "string" && current.trim()) return current.trim();
    if (typeof current === "number") return String(current);
  }
  return "";
}

function paymentReference(payload: unknown, url: URL) {
  return readString(payload, [
    ["data", "clientReference"],
    ["data", "ClientReference"],
    ["data", "reference"],
    ["Data", "ClientReference"],
    ["Data", "clientReference"],
    ["Data", "Reference"],
    ["clientReference"],
    ["ClientReference"],
    ["reference"],
    ["Reference"],
  ]) || url.searchParams.get("clientReference") || url.searchParams.get("reference") || "";
}

async function authorizeHubtelCallback(url: URL) {
  const config = await getIntegrationConfig("HUBTEL");
  const token = url.searchParams.get("token") || "";
  return Boolean(config.values.webhookToken && token === config.values.webhookToken);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!(await authorizeHubtelCallback(url))) {
    return NextResponse.json({ message: "Invalid Hubtel callback token" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const reference = paymentReference(payload, url);
  if (reference) {
    await completePayment(reference, { rawPayload: payload }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!(await authorizeHubtelCallback(url))) {
    return NextResponse.json({ message: "Invalid Hubtel callback token" }, { status: 401 });
  }

  const reference = paymentReference(null, url);
  if (reference) {
    await completePayment(reference, { rawPayload: Object.fromEntries(url.searchParams) }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
