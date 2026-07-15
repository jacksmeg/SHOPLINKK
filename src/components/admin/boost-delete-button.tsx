"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function BoostDeleteButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  function deleteAdvert() {
    const confirmed = window.confirm("Delete this seller advert from the admin page and homepage trail?");
    if (!confirmed) return;

    setMessage("");
    setIsError(false);
    startTransition(async () => {
      const response = await fetch(`/api/admin/boosts/${requestId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setIsError(true);
        setMessage(result?.message ?? "Advert could not be deleted.");
        return;
      }
      setMessage("Seller advert deleted.");
      router.refresh();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="danger" disabled={pending} onClick={deleteAdvert}>
        <Trash2 size={15} />
        {pending ? "Deleting..." : "Delete advert"}
      </Button>
      {message ? <span className={`text-xs font-semibold ${isError ? "text-red-700" : "text-cyan-800"}`}>{message}</span> : null}
    </div>
  );
}
