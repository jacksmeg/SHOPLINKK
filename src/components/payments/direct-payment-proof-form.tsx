"use client";

import { CheckCircle2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function DirectPaymentProofForm({
  endpoint,
  title = "Submit MoMo payment proof",
  sellerPaymentDetails,
}: {
  endpoint: string;
  title?: string;
  sellerPaymentDetails?: {
    storeName?: string | null;
    momoNumber?: string | null;
    phone?: string | null;
    amount?: number | string | null;
  };
}) {
  const router = useRouter();
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [buyerPaymentNote, setBuyerPaymentNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  async function uploadProof(file?: File | null) {
    if (!file) return;
    setMessage("");
    setUploading(true);
    try {
      const url = await uploadImage(file, "payment-proof");
      setPaymentProofUrl(url);
      setMessage("Payment proof uploaded.");
      setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload payment proof.");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setMessage("");
    setSuccess(false);
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference, paymentProofUrl, buyerPaymentNote }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not submit payment proof.");
        return;
      }
      setPaymentReference("");
      setBuyerPaymentNote("");
      setPaymentProofUrl("");
      setMessage("Payment proof sent. The seller will confirm it.");
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-white p-3">
      <h3 className="text-xs font-black text-[var(--ink)]">{title}</h3>
      {sellerPaymentDetails ? (
        <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--brand-dark)]">Locked seller payment details</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-[0.68rem] font-bold text-[var(--muted)]">
              Store
              <input readOnly value={sellerPaymentDetails.storeName || "ShopLinkk seller"} className="form-control mt-1 w-full bg-white px-3 text-xs" />
            </label>
            <label className="text-[0.68rem] font-bold text-[var(--muted)]">
              Mobile Money / phone
              <input readOnly value={sellerPaymentDetails.momoNumber || sellerPaymentDetails.phone || "Seller will confirm"} className="form-control mt-1 w-full bg-white px-3 text-xs" />
            </label>
            {sellerPaymentDetails.amount !== null && sellerPaymentDetails.amount !== undefined ? (
              <label className="text-[0.68rem] font-bold text-[var(--muted)] sm:col-span-2">
                Amount to pay
                <input readOnly value={formatCurrency(Number(sellerPaymentDetails.amount))} className="form-control mt-1 w-full bg-white px-3 text-xs" />
              </label>
            ) : null}
          </div>
          <p className="mt-2 text-[0.68rem] leading-5 text-[var(--muted)]">These details come from the seller store profile and cannot be changed by the buyer.</p>
        </div>
      ) : null}
      <div className="mt-3 grid gap-2">
        <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="MoMo transaction ID/reference" className="form-control px-3 text-xs" />
        <textarea value={buyerPaymentNote} onChange={(event) => setBuyerPaymentNote(event.target.value)} rows={3} placeholder="Short note, e.g. paid from 054..." className="form-control resize-none px-3 py-2 text-xs" />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] px-3 py-3 text-xs font-bold text-[var(--brand-dark)]">
          <UploadCloud size={16} />
          {uploading ? "Uploading proof..." : paymentProofUrl ? "Proof uploaded. Choose another" : "Upload payment proof"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => uploadProof(event.target.files?.[0])} />
        </label>
      </div>
      {message ? (
        <p className={`mt-3 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${success ? "bg-blue-50 text-[var(--brand-dark)]" : "bg-red-50 text-red-700"}`}>
          <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
          {message}
        </p>
      ) : null}
      <Button type="button" disabled={pending || uploading} onClick={submit} className="mt-3 w-full">
        Send payment proof
      </Button>
    </div>
  );
}
