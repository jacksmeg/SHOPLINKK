"use client";

import { AlertCircle, CheckCircle2, Megaphone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function AdvertRequestButton({ productId, productTitle }: { productId: string; productTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    setSuccess(false);
    startTransition(async () => {
      const response = await fetch(`/api/products/${productId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: "HOMEPAGE",
          headline: form.get("headline"),
          durationDays: Number(form.get("durationDays")),
          note: form.get("note"),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "The advert request could not be sent.");
        return;
      }
      setSuccess(true);
      setMessage("Request sent. Admin will confirm the fee before the advert can run.");
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="min-h-9 px-3 text-xs">
        <Megaphone size={14} /> Advertise
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#061a3a]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="advert-request-title">
          <div className="w-full max-w-md rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Homepage advert</p><h2 id="advert-request-title" className="mt-1 text-base font-black text-[var(--ink)]">Promote this product</h2><p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">{productTitle}</p></div>
              <button type="button" onClick={() => setOpen(false)} title="Close" className="grid size-8 shrink-0 place-items-center rounded-[7px] text-[var(--muted)] hover:bg-[var(--surface-muted)]"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="mt-4 grid gap-3">
              <label className="text-xs font-semibold text-[var(--ink)]">Advert headline<input name="headline" required minLength={4} maxLength={70} defaultValue={`Available now: ${productTitle}`} className="form-control mt-1.5 w-full px-3 text-xs" /></label>
              <label className="text-xs font-semibold text-[var(--ink)]">Requested duration<select name="durationDays" defaultValue="7" className="form-control mt-1.5 w-full px-3 text-xs"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
              <label className="text-xs font-semibold text-[var(--ink)]">Message to admin <span className="font-normal text-[var(--muted)]">(optional)</span><textarea name="note" maxLength={500} rows={3} placeholder="Preferred start date or campaign details" className="form-control mt-1.5 w-full resize-none px-3 py-2 text-xs" /></label>
              <p className="rounded-[7px] bg-[var(--brand-soft)] p-3 text-xs leading-5 text-[var(--brand-dark)]">Admin will send or confirm the fee. ShopLinkk does not take online payment for adverts yet.</p>
              {message ? <p className={`flex items-start gap-2 text-xs font-semibold ${success ? "text-cyan-800" : "text-red-700"}`}>{success ? <CheckCircle2 className="mt-0.5 shrink-0" size={15} /> : <AlertCircle className="mt-0.5 shrink-0" size={15} />}{message}</p> : null}
              <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending || success}><Megaphone size={15} /> {pending ? "Sending..." : success ? "Request sent" : "Request advert"}</Button></div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
