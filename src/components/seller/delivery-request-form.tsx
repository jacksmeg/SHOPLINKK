"use client";

import Link from "next/link";
import { MapPinned, Send, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";

type AvailableRider = {
  id: string;
  name: string | null;
  phone?: string | null;
  vehicleType?: string | null;
  availability: string;
};

export function DeliveryRequestForm({
  foodOrderId,
  pickupAddress,
  deliveryAddress,
  productName,
  estimatedMinutes,
  activeDeliveryId,
  activeRequestStatus,
  riders = [],
}: {
  foodOrderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  productName: string;
  estimatedMinutes?: number | null;
  activeDeliveryId?: string | null;
  activeRequestStatus?: string | null;
  riders?: AvailableRider[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState("15");
  const [riderId, setRiderId] = useState("");
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
          riderId,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not request delivery.");
        return;
      }
      setMessage(riderId ? "Delivery request sent to the selected rider." : "Delivery request sent to online riders.");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-[10px] border border-[var(--line)] bg-white p-3">
      <p className="flex items-center gap-2 text-xs font-black text-[var(--ink)]"><MapPinned size={14} /> Rider delivery request</p>
      <div className="mt-3 rounded-[8px] bg-[var(--surface-muted)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black text-[var(--ink)]">Available riders</p>
          <button type="button" onClick={() => setRiderId("")} className="text-[0.68rem] font-black text-[var(--brand-dark)]">Send to all</button>
        </div>
        {riders.length ? (
          <div className="mt-3 grid gap-2">
            {riders.map((rider) => (
              <label key={rider.id} className={`flex cursor-pointer items-start justify-between gap-3 rounded-[8px] border p-3 text-xs transition ${riderId === rider.id ? "border-[var(--brand)] bg-white shadow-sm" : "border-[var(--line)] bg-white"}`}>
                <span>
                  <span className="block font-black text-[var(--ink)]">{rider.name || "Available rider"}</span>
                  <span className="mt-1 block text-[0.68rem] text-[var(--muted)]">{titleCase(rider.vehicleType || "RIDER")} / {titleCase(rider.availability)}</span>
                  {rider.phone ? <a href={`tel:${rider.phone}`} className="mt-2 inline-flex font-black text-[var(--brand-dark)]">Call {rider.phone}</a> : null}
                </span>
                <input type="radio" checked={riderId === rider.id} onChange={() => setRiderId(rider.id)} className="mt-1 size-4 accent-[var(--brand)]" />
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">No rider is marked available right now. You can still broadcast the request, and riders will see it when they come online.</p>
        )}
      </div>
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
