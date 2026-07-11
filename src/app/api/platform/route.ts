import { NextResponse } from "next/server";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPlatformConfig();
  return NextResponse.json({
    brandName: config.brandName,
    logoUrl: config.logoUrl,
    maintenanceMode: config.maintenanceMode,
    safetyBanner: config.safetyBanner,
    defaultTown: config.defaultTown,
  });
}
