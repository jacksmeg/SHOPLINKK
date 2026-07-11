"use client";

import { BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PriceAlertButton({
  productId,
  currentPrice,
}: {
  productId: string;
  currentPrice: number;
}) {
  const [message, setMessage] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [pending, startTransition] = useTransition();

  function saveAlert() {
    startTransition(async () => {
      const response = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          targetPrice: targetPrice ? Number(targetPrice) : currentPrice,
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Price alert saved." : result?.message ?? "Could not save alert.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={targetPrice}
        onChange={(event) => setTargetPrice(event.target.value)}
        type="number"
        min="1"
        placeholder="Alert price"
        className="form-control w-32 px-3 text-xs"
      />
      <Button type="button" variant="secondary" disabled={pending} onClick={saveAlert}>
        <BellRing size={16} />
        Alert
      </Button>
      {message ? <span className="text-xs font-semibold text-[var(--muted)]">{message}</span> : null}
    </div>
  );
}
