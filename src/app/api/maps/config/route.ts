import { NextResponse } from "next/server";
import { getIntegrationConfig } from "@/lib/integration-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const maps = await getIntegrationConfig("GOOGLE_MAPS");
  return NextResponse.json({
    enabled: maps.enabled,
    apiKey: maps.enabled ? maps.values.apiKey : "",
  });
}
