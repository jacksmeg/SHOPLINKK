import { NextResponse } from "next/server";
import { getPublicTowns } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ towns: await getPublicTowns() });
}
