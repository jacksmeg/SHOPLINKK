import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api";
import { prisma } from "@/lib/db";

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { error } = await requireApiSession(["ADMIN"]);
  if (error) return error;

  const { type } = await context.params;
  let rows: Record<string, unknown>[] = [];

  if (type === "users") {
    rows = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        location: true,
        isBlocked: true,
        createdAt: true,
      },
    });
  } else if (type === "products") {
    const products = await prisma.product.findMany({
      include: { category: true, seller: { select: { email: true, name: true } } },
    });
    rows = products.map((product) => ({
      id: product.id,
      title: product.title,
      category: product.category.name,
      seller: product.seller.email ?? product.seller.name,
      price: product.price,
      status: product.listingStatus,
      stock: product.stockStatus,
      location: product.location,
      area: product.area,
      createdAt: product.createdAt,
    }));
  } else if (type === "reports") {
    rows = await prisma.report.findMany({
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        productId: true,
        reportedUserId: true,
        createdAt: true,
      },
    });
  } else {
    return jsonError("Unknown export type", 404);
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shoplinkk-${type}.csv"`,
    },
  });
}

