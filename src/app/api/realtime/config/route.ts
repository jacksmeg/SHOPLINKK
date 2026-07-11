import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api";
import { getPublicRealtimeConfig } from "@/lib/realtime";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  return NextResponse.json(await getPublicRealtimeConfig());
}
