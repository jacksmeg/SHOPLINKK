"use client";

import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CancelFoodOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function cancel() {
    if (!window.confirm("Cancel this food order?")) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/food-orders/${orderId}/cancel`, { method: "PATCH" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not cancel this order.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant="secondary" disabled={pending} onClick={cancel} className="min-h-9 px-3 text-xs">
        <XCircle size={14} />
        {pending ? "Cancelling..." : "Cancel order"}
      </Button>
      {message ? <span className="text-[0.68rem] font-semibold text-red-700">{message}</span> : null}
    </span>
  );
}
