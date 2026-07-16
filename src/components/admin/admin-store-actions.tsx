"use client";

import { CheckCircle2, ShieldOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdminStoreActions({ storeId, storeName, verified }: { storeId: string; storeName: string; verified: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function patch(action: "VERIFY" | "UNVERIFY" | "SUSPEND") {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Store updated." : result?.message ?? "Could not update store.");
      if (response.ok) router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${storeName}? This removes the store and connected food menu records.`)) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Store deleted." : result?.message ?? "Could not delete store.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" disabled={pending} onClick={() => patch(verified ? "UNVERIFY" : "VERIFY")} className="min-h-8 px-2.5 text-[0.68rem]" variant="secondary">
        <CheckCircle2 size={13} />
        {verified ? "Unverify" : "Verify"}
      </Button>
      <Button type="button" disabled={pending} onClick={() => patch("SUSPEND")} className="min-h-8 px-2.5 text-[0.68rem]" variant="secondary">
        <ShieldOff size={13} />
        Suspend
      </Button>
      <Button type="button" disabled={pending} onClick={remove} className="min-h-8 px-2.5 text-[0.68rem]" variant="danger">
        <Trash2 size={13} />
      </Button>
      {message ? <p className="basis-full text-[0.68rem] font-semibold text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
