"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type ReceiptItem = {
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptOrder = {
  id: string;
  kind: "marketplace" | "food";
  storeName: string;
  storeLogoUrl?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  deliveryAddress?: string | null;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items: ReceiptItem[];
  note?: string | null;
};

const ones = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function wordsBelowThousand(value: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const rest = value % 100;

  if (hundred) parts.push(`${ones[hundred]} hundred`);
  if (rest) {
    if (rest < 20) {
      parts.push(ones[rest]);
    } else {
      parts.push(`${tens[Math.floor(rest / 10)]}${rest % 10 ? ` ${ones[rest % 10]}` : ""}`);
    }
  }

  return parts.join(" ");
}

function amountInWords(amount: number) {
  const whole = Math.max(0, Math.floor(amount));
  if (whole === 0) return "Zero Ghana cedis only";

  const scales: Array<[number, string]> = [
    [1_000_000, "million"],
    [1_000, "thousand"],
    [1, ""],
  ];
  const parts: string[] = [];
  let remainder = whole;

  for (const [scale, label] of scales) {
    const count = Math.floor(remainder / scale);
    if (!count) continue;
    parts.push(`${wordsBelowThousand(count)}${label ? ` ${label}` : ""}`);
    remainder %= scale;
  }

  return `${parts.join(" ")} Ghana cedis only`.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function OrderReceiptButton({ order }: { order: ReceiptOrder }) {
  function printReceipt() {
    const windowRef = window.open("", "_blank", "width=900,height=900");
    if (!windowRef) return;

    const rows = order.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.title)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.lineTotal)}</td>
          </tr>
        `,
      )
      .join("");

    windowRef.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(order.storeName)} receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; color: #071b3a; background: #f5f7fb; }
            .sheet { max-width: 760px; margin: 24px auto; background: white; padding: 32px; border: 1px solid #d8e0ef; }
            .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 3px solid #071b3a; padding-bottom: 18px; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand img { width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #d8e0ef; }
            h1 { margin: 0; font-size: 24px; }
            .muted { color: #5a6a83; font-size: 12px; line-height: 1.6; }
            .pill { background: #071b3a; color: white; padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 22px 0; }
            .box { border: 1px solid #d8e0ef; border-radius: 10px; padding: 14px; }
            .label { color: #5a6a83; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
            .value { margin-top: 6px; font-size: 14px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th { background: #071b3a; color: white; text-align: left; font-size: 12px; padding: 10px; }
            td { border-bottom: 1px solid #d8e0ef; padding: 11px 10px; font-size: 12px; }
            .total { margin-top: 20px; display: flex; justify-content: flex-end; }
            .total-box { min-width: 280px; background: #071b3a; color: white; border-radius: 12px; padding: 18px; }
            .total-box strong { font-size: 26px; display: block; margin-top: 6px; }
            .words { margin-top: 18px; border: 1px dashed #071b3a; border-radius: 10px; padding: 14px; font-weight: 700; }
            .footer { margin-top: 24px; font-size: 11px; color: #5a6a83; text-align: center; }
            @media print { body { background: white; } .sheet { margin: 0; max-width: none; border: 0; } }
          </style>
        </head>
        <body>
          <main class="sheet">
            <section class="top">
              <div class="brand">
                ${order.storeLogoUrl ? `<img src="${escapeHtml(order.storeLogoUrl)}" alt="${escapeHtml(order.storeName)} logo" />` : ""}
                <div>
                  <h1>${escapeHtml(order.storeName)}</h1>
                  <div class="muted">${escapeHtml(order.storeAddress || "Dunkwa-on-Offin, Ghana")}</div>
                  <div class="muted">${escapeHtml(order.storePhone || "Phone not set")}</div>
                </div>
              </div>
              <div class="pill">${order.kind === "food" ? "Food receipt" : "Sales invoice"}</div>
            </section>
            <section class="grid">
              <div class="box">
                <div class="label">Buyer</div>
                <div class="value">${escapeHtml(order.buyerName || "Buyer")}</div>
                <div class="muted">${escapeHtml(order.buyerPhone || "No phone")}</div>
              </div>
              <div class="box">
                <div class="label">Order</div>
                <div class="value">#${escapeHtml(order.id.slice(0, 10).toUpperCase())}</div>
                <div class="muted">${new Date(order.createdAt).toLocaleString()}</div>
              </div>
              <div class="box">
                <div class="label">Status</div>
                <div class="value">${escapeHtml(order.status)}</div>
              </div>
              <div class="box">
                <div class="label">Payment</div>
                <div class="value">${escapeHtml(order.paymentStatus)}</div>
              </div>
            </section>
            <div class="box">
              <div class="label">Delivery address</div>
              <div class="value">${escapeHtml(order.deliveryAddress || "Buyer will confirm")}</div>
            </div>
            <table>
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <section class="total">
              <div class="total-box">
                Total amount
                <strong>${formatCurrency(order.totalAmount)}</strong>
              </div>
            </section>
            <div class="words">Amount in words: ${escapeHtml(amountInWords(order.totalAmount))}</div>
            ${order.note ? `<div class="footer">${escapeHtml(order.note)}</div>` : ""}
            <div class="footer">Generated by ShopLinkk</div>
          </main>
          <script>window.print();</script>
        </body>
      </html>
    `);
    windowRef.document.close();
  }

  return (
    <Button type="button" variant="secondary" onClick={printReceipt} className="min-h-9 px-3 text-xs">
      <Printer size={14} />
      Print receipt
    </Button>
  );
}
