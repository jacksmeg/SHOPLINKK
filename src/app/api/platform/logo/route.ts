import { NextResponse } from "next/server";
import { appUrl } from "@/lib/email";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPlatformConfig();
  const logoUrl = config.logoUrl || "/brand/shoplinkk-mark.webp";
  const absoluteLogoUrl = logoUrl.startsWith("http") ? logoUrl : appUrl(logoUrl);

  return NextResponse.redirect(absoluteLogoUrl, 302);
}
