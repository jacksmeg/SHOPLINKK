import type { OrderReturn } from "@/generated/prisma/client";
import { OrderReturnForm } from "@/components/orders/order-return-form";
import { formatCurrency, titleCase } from "@/lib/utils";

export function OrderReturnCard({ entry, audience }: { entry: OrderReturn; audience: "buyer" | "seller" | "admin" }) {
  return (
    <article className="mt-3 rounded-[8px] border border-[var(--line)] bg-white p-3 text-xs">
      <h3 className="font-black">Return request · {titleCase(entry.status)}</h3>
      <p className="mt-1 text-[var(--muted)]">{titleCase(entry.orderKind)} order {entry.orderId} · {formatCurrency(Number(entry.orderAmount))}</p>
      <p className="mt-2 break-words">{entry.reason}</p>
      {entry.sellerNote ? <p className="mt-2 break-words"><strong>Seller decision</strong> {entry.sellerNote}</p> : null}
      {entry.adminNote ? <p className="mt-2 break-words"><strong>ShopLinkk decision</strong> {entry.adminNote}</p> : null}
      {entry.refundAmount != null ? <p className="mt-2 break-words"><strong>Refund recorded</strong> {formatCurrency(Number(entry.refundAmount))} · {entry.refundReference}</p> : null}
      {audience === "buyer" && ["REQUESTED", "APPROVED", "REJECTED"].includes(entry.status) ? (
        <OrderReturnForm target={{ returnId: entry.id }} actions={["ESCALATED"]} />
      ) : null}
      {audience === "seller" && entry.status === "REQUESTED" ? (
        <OrderReturnForm target={{ returnId: entry.id }} actions={["APPROVED", "REJECTED"]} />
      ) : null}
      {audience === "seller" && entry.status === "APPROVED" ? (
        <OrderReturnForm target={{ returnId: entry.id }} actions={["REFUNDED"]} maxRefund={Number(entry.orderAmount)} />
      ) : null}
      {audience === "admin" && entry.status === "ESCALATED" ? (
        <OrderReturnForm target={{ returnId: entry.id }} actions={["REFUNDED", "CLOSED"]} maxRefund={Number(entry.orderAmount)} />
      ) : null}
    </article>
  );
}
