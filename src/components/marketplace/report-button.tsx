"use client";

import { Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ReportButton({
  productId,
  reportedUserId,
}: {
  productId?: string;
  reportedUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Suspicious listing");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, reportedUserId, reason, details }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        setSubmitted(true);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Flag size={17} />
        Report
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitReport}
            className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-2xl"
          >
            {submitted ? (
              <>
                <h2 className="text-xl font-black text-[var(--ink)]">Report received</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Thanks for helping keep ShopLinkk safe. An admin can review this from the moderation panel.
                </p>
                <Button type="button" className="mt-5 w-full" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-[var(--ink)]">Report an issue</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Use this for fake listings, unsafe behavior, wrong prices, or suspicious sellers.
                </p>
                <label className="mt-5 block text-sm font-bold text-[var(--ink)]">
                  Reason
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                  >
                    <option>Suspicious listing</option>
                    <option>Wrong product information</option>
                    <option>Seller asked for unsafe payment</option>
                    <option>Harassment or abuse</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
                  Details
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                    placeholder="Tell the admin what happened..."
                  />
                </label>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" disabled={pending}>
                    Submit report
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      ) : null}
    </>
  );
}
