"use client";

import { CheckCircle2, Trash2, Truck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function FoodOrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function update(status: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/seller/food/orders/${orderId}`, {
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

  function clearOrder() {
    setMessage("");
    if (!window.confirm("Clear this delivered or cancelled order from your board?")) return;
    startTransition(async () => {
      const response = await fetch(`/api/seller/food/orders/${orderId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Only delivered or cancelled orders can be cleared.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => update("PAID")} className="min-h-9 px-3 text-xs">
        <CheckCircle2 size={14} />
        Payment received
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => update("PREPARING")} className="min-h-9 px-3 text-xs">
        Preparing
      </Button>
      <Button type="button" disabled={pending} onClick={() => update("OUT_FOR_DELIVERY")} className="min-h-9 px-3 text-xs">
        <Truck size={14} />
        Out for delivery
      </Button>
      <Button type="button" disabled={pending} onClick={() => update("DELIVERED")} className="min-h-9 px-3 text-xs">
        Delivered
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => update("CANCELLED")} className="min-h-9 px-3 text-xs">
        <XCircle size={14} />
        Cancel
      </Button>
      <Button type="button" variant="danger" disabled={pending} onClick={clearOrder} className="min-h-9 px-3 text-xs">
        <Trash2 size={14} />
        Clear delivered
      </Button>
      {message ? <p className="text-xs font-semibold text-red-700">{message}</p> : null}
    </div>
  );
}
