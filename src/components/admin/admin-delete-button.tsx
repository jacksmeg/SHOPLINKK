"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AdminDeleteButton({
  endpoint,
  label = "Delete",
  confirmText = "Delete this record?",
}: {
  endpoint: string;
  label?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(confirmText)) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Deleted." : result?.message ?? "Could not delete.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant="danger" disabled={pending} onClick={remove} className="min-h-8 px-2.5 text-[0.68rem]">
        <Trash2 size={13} />
        {pending ? "Deleting..." : label}
      </Button>
      {message ? <span className="text-[0.68rem] font-semibold text-[var(--muted)]">{message}</span> : null}
    </span>
  );
}
