"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleFavorite() {
    startTransition(async () => {
      const method = saved ? "DELETE" : "POST";
      const url = saved ? `/api/favorites/${productId}` : "/api/favorites";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: saved ? undefined : JSON.stringify({ productId }),
      });

      if (response.ok) {
        setSaved((value) => !value);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 border border-white/70 bg-white/95 font-semibold text-[var(--ink)] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-[var(--brand)] disabled:opacity-60",
        compact ? "size-9 rounded-full" : "min-h-10 rounded-[7px] px-4 text-xs",
      )}
      aria-label="Save product"
    >
      <Heart size={compact ? 18 : 17} className={saved ? "fill-[var(--coral)] text-[var(--coral)]" : ""} />
      {compact ? null : saved ? "Saved" : "Save"}
    </button>
  );
}
