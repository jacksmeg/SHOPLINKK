import { NextResponse } from "next/server";
import { acceptableUsePolicyText } from "@/lib/acceptable-use-policy";

export function GET() {
  return new NextResponse(acceptableUsePolicyText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shoplinkk-acceptable-use-policy.txt"',
    },
  });
}
