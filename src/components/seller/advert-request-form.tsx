"use client";

import { AlertCircle, CheckCircle2, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function AdvertRequestForm({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const router = useRouter();
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
          placement: form.get("placement"),
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
      setMessage("Advert request sent. Admin will confirm the fee before the advert can run.");
      router.refresh();
      event.currentTarget.reset();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <form onSubmit={submit} className="app-panel p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-[var(--ink)]">
          Advert placement
          <select name="placement" defaultValue="HOMEPAGE" className="form-control mt-1.5 w-full bg-white px-3 text-xs">
            <option value="HOMEPAGE">Homepage animated advert trail</option>
            <option value="MARKETPLACE">Featured marketplace placement</option>
          </select>
        </label>
        <label className="text-xs font-bold text-[var(--ink)]">
          Requested duration
          <select name="durationDays" defaultValue="7" className="form-control mt-1.5 w-full bg-white px-3 text-xs">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-xs font-bold text-[var(--ink)]">
        Advert headline
        <input
          name="headline"
          required
          minLength={4}
          maxLength={70}
          defaultValue={`Available now: ${productTitle}`}
          className="form-control mt-1.5 w-full px-3 text-xs"
        />
      </label>
      <label className="mt-4 block text-xs font-bold text-[var(--ink)]">
        Message to admin <span className="font-normal text-[var(--muted)]">(optional)</span>
        <textarea
          name="note"
          maxLength={500}
          rows={4}
          placeholder="Preferred start date, advert details, or payment discussion."
          className="form-control mt-1.5 w-full resize-none px-3 py-2 text-xs"
        />
      </label>
      <p className="mt-4 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs leading-5 text-[var(--brand-dark)]">
        Admin will review the request and confirm the fee. ShopLinkk does not take online advert payments yet.
      </p>
      {message ? (
        <p className={`mt-4 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${success ? "bg-blue-50 text-[var(--brand-dark)]" : "bg-red-50 text-red-700"}`}>
          {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={15} /> : <AlertCircle className="mt-0.5 shrink-0" size={15} />}
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || success} className="mt-5">
        <Megaphone size={16} />
        {pending ? "Sending..." : success ? "Request sent" : "Request advert"}
      </Button>
    </form>
  );
}
