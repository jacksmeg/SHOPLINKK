import { NextResponse } from "next/server";
import { buildLivenessReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildLivenessReport());
}
