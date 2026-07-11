"use client";

import { Check, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdvertExtensionActions({
  requestId,
  requestedDays,
  requestedNote,
}: {
  requestId: string;
  requestedDays: number | null;
  requestedNote: string | null;
}) {
  const router = useRouter();
  const [days, setDays] = useState(String(requestedDays ?? 7));
  const [note, setNote] = useState(requestedNote ?? "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject") {
    setMessage("");
    setIsError(false);
    startTransition(async () => {
      const response = await fetch(`/api/admin/boosts/${requestId}/extension`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days: Number(days), note }),
      });
      const result = await response.json().catch(() => null);
      setIsError(!response.ok);
      setMessage(response.ok ? (action === "approve" ? "Advert extension approved." : "Advert extension rejected.") : result?.message ?? "Action failed.");
      if (response.ok) router.refresh();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <div className="mt-4 rounded-[8px] border border-cyan-200 bg-cyan-50/70 p-3">
      <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto]">
        <label className="text-[0.68rem] font-semibold text-cyan-950">
          Extra days
          <select value={days} onChange={(event) => setDays(event.target.value)} className="form-control mt-1 w-full bg-white px-2 text-xs">
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
        <label className="text-[0.68rem] font-semibold text-cyan-950">
          Admin note
          <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Decision note" className="form-control mt-1 w-full bg-white px-3 text-xs" />
        </label>
        <div className="flex items-end gap-2">
          <Button type="button" disabled={pending} onClick={() => run("approve")}><Check size={14} /> Approve</Button>
          <Button type="button" variant="danger" disabled={pending} onClick={() => run("reject")}><X size={14} /> Reject</Button>
        </div>
      </div>
      {requestedNote ? <p className="mt-3 text-xs leading-5 text-cyan-950"><strong>Seller note:</strong> {requestedNote}</p> : null}
      {message ? <p className={`mt-3 text-xs font-semibold ${isError ? "text-red-700" : "text-cyan-900"}`}><Save className="mr-1 inline" size={14} />{message}</p> : null}
    </div>
  );
}
