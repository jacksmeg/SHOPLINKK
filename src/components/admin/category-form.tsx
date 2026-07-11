"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function CategoryForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          icon: formData.get("icon"),
        }),
      });
      setMessage(response.ok ? "Category created." : "Could not create category.");
      if (response.ok) event.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[var(--ink)]">Add category</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
        <input name="name" required placeholder="Name" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="description" placeholder="Description" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="icon" placeholder="Lucide icon" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <Button type="submit" disabled={pending}>
          <Plus size={16} />
          Add
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}

