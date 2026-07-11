"use client";

import { AlertCircle, CheckCircle2, Clock3, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { titleCase } from "@/lib/utils";

type ExtensionStatus = "NONE" | "REQUESTED" | "APPROVED" | "REJECTED";
type BoostStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "ENDED";

export function AdvertManageActions({
  requestId,
  status,
  extensionStatus,
}: {
  requestId: string;
  status: BoostStatus | string;
  extensionStatus: ExtensionStatus | string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  const canRequest = (status === "APPROVED" || status === "ENDED") && extensionStatus !== "REQUESTED";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const response = await fetch(`/api/seller/adverts/${requestId}/extension`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: Number(form.get("days")),
          note: form.get("note"),
        }),
      });
      const result = await response.json().catch(() => null);
      setIsError(!response.ok);
      setMessage(response.ok ? "Extension request sent to admin." : result?.message ?? "Could not send extension request.");
      if (response.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (extensionStatus === "REQUESTED") {
    return (
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-[0.68rem] font-bold text-cyan-800">
        <Clock3 size={13} /> Extension waiting for admin review
      </p>
    );
  }

  if (!canRequest) {
    return extensionStatus === "REJECTED" ? (
      <p className="mt-3 text-[0.68rem] font-semibold text-red-700">Last extension request was rejected.</p>
    ) : null;
  }

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      {!open ? (
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          <PlusCircle size={15} />
          Request more days
        </Button>
      ) : (
        <form onSubmit={submit} className="grid gap-3 rounded-[8px] border border-[var(--line)] bg-white p-3 sm:grid-cols-[160px_1fr_auto]">
          <label className="text-[0.68rem] font-semibold text-[var(--muted)]">
            Extra days
            <select name="days" defaultValue="7" className="form-control mt-1 w-full bg-white px-2 text-xs">
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </label>
          <label className="text-[0.68rem] font-semibold text-[var(--muted)]">
            Note to admin
            <input name="note" maxLength={500} placeholder="Why you want to extend this advert" className="form-control mt-1 w-full px-3 text-xs" />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {message ? (
        <p className={`mt-3 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${isError ? "bg-red-50 text-red-700" : "bg-blue-50 text-[var(--brand-dark)]"}`}>
          {isError ? <AlertCircle className="mt-0.5 shrink-0" size={15} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={15} />}
          {message}
        </p>
      ) : null}
      {extensionStatus !== "NONE" && extensionStatus !== "REQUESTED" ? (
        <p className="mt-2 text-[0.68rem] text-[var(--muted)]">Previous extension status: {titleCase(extensionStatus)}</p>
      ) : null}
    </div>
  );
}
