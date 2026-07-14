"use client";

import { CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function MarketplaceOrderActions({ orderId }: { orderId: string }) {
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

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
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
      {message ? <p className="text-xs font-semibold text-red-700">{message}</p> : null}
    </div>
  );
}
