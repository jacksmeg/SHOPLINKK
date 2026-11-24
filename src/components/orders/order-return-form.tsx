"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Action = "APPROVED" | "REJECTED" | "ESCALATED" | "REFUNDED" | "CLOSED";
const labels: Record<Action, string> = {
  APPROVED: "Approve return",
  REJECTED: "Reject return",
  ESCALATED: "Ask ShopLinkk to review",
  REFUNDED: "Record refund sent",
  CLOSED: "Close without refund",
};

export function OrderReturnForm({ target, actions = [], maxRefund }: {
  target: { kind: "marketplace" | "food"; orderId: string } | { returnId: string };
  actions?: Action[];
  maxRefund?: number;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const creating = "orderId" in target;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = creating
      ? { ...target, reason: form.get("note") }
      : { status: action, note: form.get("note") || undefined, amount: action === "REFUNDED" ? Number(form.get("amount")) : undefined, reference: action === "REFUNDED" ? form.get("reference") : undefined };
    setError("");
    setPending(true);
    try {
      const response = await fetch(creating ? "/api/order-returns" : `/api/order-returns/${target.returnId}`, {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || "The return could not be updated.");
      }
      setOpen(false);
      setAction(null);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The return could not be updated.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return (
    <div className="mt-3 flex flex-wrap gap-2">
      {creating ? <Button type="button" variant="secondary" onClick={() => setOpen(true)}>Request return or refund</Button> : null}
      {actions.map((value) => <Button key={value} type="button" variant="secondary" onClick={() => { setAction(value); setOpen(true); }}>{labels[value]}</Button>)}
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-[8px] border border-[var(--line)] p-3 text-xs">
      {action === "REFUNDED" ? (
        <>
          <label className="grid gap-1">Amount sent (GHS)<input className="form-control px-3" name="amount" type="number" step="0.01" min="0.01" max={maxRefund} required /></label>
          <label className="grid gap-1">Refund transaction reference<input className="form-control px-3" name="reference" maxLength={120} required /></label>
        </>
      ) : null}
      {action !== "ESCALATED" ? (
        <label className="grid gap-1">
          {creating ? "Reason for the request" : "Decision note"}
          <textarea className="form-control px-3 py-2" name="note" rows={3} minLength={creating ? 5 : undefined} maxLength={1000} required={creating || action === "REJECTED" || action === "CLOSED"} />
        </label>
      ) : null}
      {action === "ESCALATED" ? <p>Send this request and any seller decision to ShopLinkk for review.</p> : null}
      {error ? <p role="alert" className="text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>{creating ? "Send request" : action && labels[action]}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => { setOpen(false); setError(""); }}>Back</Button>
      </div>
    </form>
  );
}
