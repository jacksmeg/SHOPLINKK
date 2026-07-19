import { NextResponse } from "next/server";
import { buildReadinessReport } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await buildReadinessReport();
  return NextResponse.json(report.body, { status: report.status });
}
