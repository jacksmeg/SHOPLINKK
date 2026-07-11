"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function StaffForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
        }),
      });
      setMessage(response.ok ? "Staff invite sent." : "Could not create staff account.");
      if (response.ok) event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mb-5 rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-black text-[var(--ink)]"><UserPlus size={18} /> Create staff account</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="name" required placeholder="Staff name" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="email" type="email" required placeholder="Staff email" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <Button type="submit" disabled={pending}>Invite</Button>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}

