"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdminDeliveryAssignForm({
  requestId,
  riders,
}: {
  requestId: string;
  riders: { id: string; name: string | null }[];
}) {
  const router = useRouter();
  const [riderId, setRiderId] = useState(riders[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function assign() {
    if (!riderId) {
      setMessage("Choose a rider first.");
      return;
    }
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/deliveries/${requestId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not assign rider.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
      <select value={riderId} onChange={(event) => setRiderId(event.target.value)} className="form-control bg-white px-3 text-xs">
        {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.name || "Unnamed rider"}</option>)}
      </select>
      <Button type="button" disabled={pending || !riders.length} onClick={assign} className="min-h-9 px-3 text-xs"><Send size={14} /> Assign</Button>
      {message ? <p className="text-xs font-bold text-red-700 sm:col-span-2">{message}</p> : null}
    </div>
  );
}
