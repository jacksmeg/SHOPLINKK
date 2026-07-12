"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RiderRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function decide(action: "ACCEPT" | "REJECT") {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/rider/delivery-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not update request.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" disabled={pending} onClick={() => decide("ACCEPT")} className="min-h-9 px-3 text-xs">
        <CheckCircle2 size={14} />
        Accept
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => decide("REJECT")} className="min-h-9 px-3 text-xs">
        <XCircle size={14} />
        Reject
      </Button>
      {message ? <p className="text-xs font-bold text-red-700">{message}</p> : null}
    </div>
  );
}
