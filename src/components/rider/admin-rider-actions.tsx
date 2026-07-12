"use client";

import { CheckCircle2, ShieldOff, Undo2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdminRiderActions({ riderId }: { riderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function act(action: "APPROVE" | "REJECT" | "SUSPEND" | "UNSUSPEND") {
    const note = action === "REJECT" || action === "SUSPEND" ? window.prompt("Reason or note for this rider?") || "" : "";
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/riders/${riderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not update rider.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button type="button" disabled={pending} onClick={() => act("APPROVE")} className="min-h-8 px-3 text-[0.68rem]"><CheckCircle2 size={13} /> Approve</Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => act("UNSUSPEND")} className="min-h-8 px-3 text-[0.68rem]"><Undo2 size={13} /> Restore</Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => act("REJECT")} className="min-h-8 px-3 text-[0.68rem]"><XCircle size={13} /> Reject</Button>
      <Button type="button" variant="danger" disabled={pending} onClick={() => act("SUSPEND")} className="min-h-8 px-3 text-[0.68rem]"><ShieldOff size={13} /> Suspend</Button>
      {message ? <p className="text-xs font-bold text-red-700">{message}</p> : null}
    </div>
  );
}
