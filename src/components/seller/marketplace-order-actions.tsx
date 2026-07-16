"use client";

import { CheckCircle2, CreditCard, PackageCheck, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function MarketplaceOrderActions({
  orderId,
  status,
  paymentRequested,
}: {
  orderId: string;
  status?: string;
  paymentRequested?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function update(status: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not update order.");
        return;
      }
      router.refresh();
    });
  }

  function deleteOrder() {
    if (!window.confirm("Delete this completed order record?")) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/seller/orders/${orderId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not delete order.");
        return;
      }
      router.refresh();
    });
  }

  const canDelete = status === "DELIVERED" || status === "CANCELLED";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {!paymentRequested && status !== "CANCELLED" && status !== "DELIVERED" ? (
        <Button type="button" disabled={pending} onClick={() => update("REQUEST_PAYMENT")} className="min-h-9 px-3 text-xs">
          <CreditCard size={14} />
          Request payment
        </Button>
      ) : null}
      <Button type="button" variant="secondary" disabled={pending} onClick={() => update("PAID")} className="min-h-9 px-3 text-xs">
        <CheckCircle2 size={14} />
        Payment received
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => update("READY")} className="min-h-9 px-3 text-xs">
        <PackageCheck size={14} />
        Ready
      </Button>
      <Button type="button" disabled={pending} onClick={() => update("DELIVERED")} className="min-h-9 px-3 text-xs">
        Delivered
      </Button>
      <Button type="button" variant="danger" disabled={pending} onClick={() => update("CANCELLED")} className="min-h-9 px-3 text-xs">
        <XCircle size={14} />
        Cancel
      </Button>
      {canDelete ? (
        <Button type="button" variant="danger" disabled={pending} onClick={deleteOrder} className="min-h-9 px-3 text-xs">
          <Trash2 size={14} />
          Delete
        </Button>
      ) : null}
      {message ? <p className="text-xs font-semibold text-red-700">{message}</p> : null}
    </div>
  );
}
