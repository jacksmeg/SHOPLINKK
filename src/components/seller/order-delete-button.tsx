"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function OrderDeleteButton({
  endpoint,
  label = "Delete",
}: {
  endpoint: string;
  label?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Delete this completed order record?")) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not delete order.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="danger" disabled={pending} onClick={remove} className="min-h-9 px-3 text-xs">
        <Trash2 size={14} />
        {pending ? "Deleting..." : label}
      </Button>
      {message ? <span className="text-xs font-semibold text-red-700">{message}</span> : null}
    </span>
  );
}
