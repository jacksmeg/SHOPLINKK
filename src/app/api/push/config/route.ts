import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api";
import { getIntegrationConfig } from "@/lib/integration-settings";
import { getWebPushPublicKey } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;
  const config = await getIntegrationConfig("WEB_PUSH");
  let publicKey = "";
  try {
    publicKey = await getWebPushPublicKey();
  } catch {
    publicKey = "";
  }
  return NextResponse.json({ enabled: config.enabled && Boolean(publicKey), publicKey });
}
