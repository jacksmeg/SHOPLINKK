"use client";

import { Bell, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { PublicCategory } from "@/lib/marketplace";
import { townLocations } from "@/lib/demo-data";

export function SavedSearchForm({ categories }: { categories: PublicCategory[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          query: formData.get("query"),
          category: formData.get("category"),
          location: formData.get("location"),
          minPrice: formData.get("minPrice") || undefined,
          maxPrice: formData.get("maxPrice") || undefined,
          alertsEnabled: Boolean(formData.get("alertsEnabled")),
        }),
      });

      setMessage(response.ok ? "Saved search created." : "Could not save search.");
      if (response.ok) {
        event.currentTarget.reset();
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[var(--ink)]">Create saved search</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input name="name" required placeholder="Search name" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="query" placeholder="Keyword" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <select name="category" className="min-h-11 rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="location" className="min-h-11 rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
          <option value="">All locations</option>
          {townLocations.map((town) => (
            <option key={town} value={town}>
              {town}
            </option>
          ))}
        </select>
        <input name="minPrice" type="number" placeholder="Min price" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        <input name="maxPrice" type="number" placeholder="Max price" className="min-h-11 rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <input name="alertsEnabled" type="checkbox" className="size-4 accent-[var(--brand)]" />
          <Bell size={16} />
          Price drop alerts
        </label>
        <Button type="submit" disabled={pending}>
          <Save size={16} />
          {pending ? "Saving..." : "Save search"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
    </form>
  );
}

