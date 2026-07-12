"use client";

import Link from "next/link";
import { MapPinned, Send, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeliveryRequestForm({
  foodOrderId,
  pickupAddress,
  deliveryAddress,
  productName,
  estimatedMinutes,
  activeDeliveryId,
  activeRequestStatus,
}: {
  foodOrderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  productName: string;
  estimatedMinutes?: number | null;
  activeDeliveryId?: string | null;
  activeRequestStatus?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState("15");
  const [pending, startTransition] = useTransition();

  if (activeDeliveryId) {
    return (
      <Link href={`/deliveries/${activeDeliveryId}`} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-[8px] bg-[var(--brand)] px-3 text-xs font-black text-white">
        <Truck size={14} />
        Track live delivery
      </Link>
    );
  }

  if (activeRequestStatus) {
    return (
      <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-xs font-bold text-blue-900">
        Delivery request is {activeRequestStatus.toLowerCase().replace(/_/g, " ")}. A rider will accept soon.
      </p>
    );
  }

  function submit() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/seller/delivery-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodOrderId,
          pickupAddress,
          deliveryAddress,
          productName,
          deliveryFee: fee,
          estimatedMinutes: estimatedMinutes || "",
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not request delivery.");
        return;
      }
      setMessage("Delivery request sent to online riders.");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-[10px] border border-[var(--line)] bg-white p-3">
      <p className="flex items-center gap-2 text-xs font-black text-[var(--ink)]"><MapPinned size={14} /> Rider delivery request</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="text-xs font-bold text-[var(--ink)]">
          Delivery fee
          <input value={fee} onChange={(event) => setFee(event.target.value)} inputMode="decimal" className="form-control mt-1 w-full px-3 text-xs" />
        </label>
        <Button type="button" disabled={pending} onClick={submit} className="self-end">
          <Send size={14} />
          Request rider
        </Button>
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-[var(--brand-dark)]">{message}</p> : null}
    </div>
  );
}
