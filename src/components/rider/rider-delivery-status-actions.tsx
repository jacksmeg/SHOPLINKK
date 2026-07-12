"use client";

import { CheckCircle2, Navigation, PackageCheck, Store, Truck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

const actions = [
  { status: "HEADING_TO_SELLER", label: "Heading to seller", icon: Store },
  { status: "ITEM_PICKED_UP", label: "Item picked up", icon: PackageCheck },
  { status: "ON_THE_WAY", label: "On the way", icon: Navigation },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { status: "CANCELLED", label: "Cancel", icon: XCircle, danger: true },
] as const;

export function RiderDeliveryStatusActions({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function update(status: string) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/rider/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not update delivery.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--ink)]"><Truck size={14} /> Update delivery status</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action.status} type="button" variant={"danger" in action && action.danger ? "danger" : "secondary"} disabled={pending} onClick={() => update(action.status)} className="min-h-9 px-3 text-xs">
            <action.icon size={14} />
            {action.label}
          </Button>
        ))}
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-red-700">{message}</p> : null}
    </div>
  );
}
