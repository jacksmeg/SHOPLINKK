"use client";

import { GitCompareArrows } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CompareButton({ productId }: { productId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function addToCompare() {
    startTransition(async () => {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Added to compare." : result?.message ?? "Could not add.");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={addToCompare}>
        <GitCompareArrows size={16} />
        Compare
      </Button>
      {message ? <span className="text-xs font-semibold text-[var(--muted)]">{message}</span> : null}
    </span>
  );
}
