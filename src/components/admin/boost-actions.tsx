"use client";

import { Check, CircleDollarSign, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type PaymentStatus = "PENDING" | "CONFIRMED" | "WAIVED";

export function BoostActions({
  requestId,
  initialDays,
  initialFee,
  initialPaymentStatus,
  initialReference,
}: {
  requestId: string;
  initialDays: number;
  initialFee: number | null;
  initialPaymentStatus: PaymentStatus | "REFUNDED";
  initialReference: string | null;
}) {
  const router = useRouter();
  const [days, setDays] = useState(String(initialDays));
  const [feeAmount, setFeeAmount] = useState(initialFee === null ? "" : String(initialFee));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialPaymentStatus === "REFUNDED" ? "PENDING" : initialPaymentStatus);
  const [feeReference, setFeeReference] = useState(initialReference ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: "quote" | "approve" | "reject") {
    setMessage("");
    setIsError(false);
    startTransition(async () => {
      const response = await fetch(`/api/admin/boosts/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          days: Number(days),
          feeAmount: feeAmount === "" ? null : Number(feeAmount),
          paymentStatus,
          feeReference,
          note,
        }),
      });
      const result = await response.json().catch(() => null);
      setIsError(!response.ok);
      setMessage(response.ok
        ? action === "quote" ? "Fee details saved and seller notified." : action === "approve" ? "Homepage advert is now live." : "Advert request rejected."
        : result?.message ?? "Action failed.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-[0.68rem] font-semibold text-[var(--muted)]">Duration<select value={days} onChange={(event) => setDays(event.target.value)} className="form-control mt-1 w-full px-2 text-xs"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
        <label className="text-[0.68rem] font-semibold text-[var(--muted)]">Fee in Ghana cedis<input value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="form-control mt-1 w-full px-3 text-xs" /></label>
        <label className="text-[0.68rem] font-semibold text-[var(--muted)]">Payment record<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)} className="form-control mt-1 w-full px-2 text-xs"><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed offline</option><option value="WAIVED">Fee waived</option></select></label>
        <label className="text-[0.68rem] font-semibold text-[var(--muted)]">Reference<input value={feeReference} onChange={(event) => setFeeReference(event.target.value)} placeholder="Receipt or note reference" className="form-control mt-1 w-full px-3 text-xs" /></label>
      </div>
      <label className="mt-3 block text-[0.68rem] font-semibold text-[var(--muted)]">Admin note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Fee instructions, decision, or campaign note" className="form-control mt-1 w-full px-3 text-xs" /></label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run("quote")}><Save size={14} /> Save fee</Button>
        <Button type="button" disabled={pending} onClick={() => run("approve")}><Check size={14} /> Run advert</Button>
        <Button type="button" variant="danger" disabled={pending} onClick={() => run("reject")}><X size={14} /> Reject</Button>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[0.68rem] leading-5 text-[var(--muted)]"><CircleDollarSign className="mt-0.5 shrink-0" size={14} /> No online payment is taken here. Confirm a seller&apos;s offline advert fee or waive it before selecting Run advert.</p>
      {message ? <p className={`mt-2 text-xs font-semibold ${isError ? "text-red-700" : "text-cyan-800"}`}>{message}</p> : null}
    </div>
  );
}
