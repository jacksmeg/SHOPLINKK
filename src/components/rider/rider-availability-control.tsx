"use client";

import { LoaderCircle, RadioTower } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const statuses = [
  { value: "OFFLINE", label: "Offline" },
  { value: "ONLINE", label: "Online" },
  { value: "BUSY", label: "Busy" },
  { value: "ON_DELIVERY", label: "On delivery" },
] as const;

export function RiderAvailabilityControl({ current, disabled }: { current: string; disabled?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function update(availability: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/rider/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not update rider status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="app-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--ink)]">Availability</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Go online when you are ready to receive delivery requests.</p>
        </div>
        <RadioTower className="text-[var(--brand)]" size={20} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statuses.map((status) => (
          <button
            key={status.value}
            type="button"
            disabled={disabled || pending}
            onClick={() => update(status.value)}
            className={cn(
              "min-h-10 rounded-[8px] border px-3 text-xs font-black transition disabled:opacity-50",
              current === status.value
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand-dark)]",
            )}
          >
            {pending && current !== status.value ? <LoaderCircle className="mr-1 inline animate-spin" size={13} /> : null}
            {status.label}
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 text-xs font-bold text-red-700">{message}</p> : null}
    </div>
  );
}
