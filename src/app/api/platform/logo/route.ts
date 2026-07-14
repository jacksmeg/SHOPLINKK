import { NextResponse } from "next/server";
import { defaultLogoUrl } from "@/lib/brand-assets";
import { appUrl } from "@/lib/email";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPlatformConfig();
  const logoUrl = config.logoUrl || defaultLogoUrl;
  const absoluteLogoUrl = logoUrl.startsWith("http") ? logoUrl : appUrl(logoUrl);

  return NextResponse.redirect(absoluteLogoUrl, 302);
}
