"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-16 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-[8px] bg-red-50 text-red-600">
          <AlertTriangle size={30} />
        </div>
        <h1 className="mt-5 text-xl font-black text-[var(--ink)]">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          ShopLinkk could not load this view. Try again, or return to the marketplace.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={reset}>Try again</Button>
          <ButtonLink href="/marketplace" variant="secondary">Marketplace</ButtonLink>
        </div>
      </div>
    </div>
  );
}
