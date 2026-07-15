"use client";

import Image from "next/image";
import { Edit3, PlusCircle, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { PublicFoodCategory } from "@/lib/food-categories";
import { Button } from "@/components/ui/button";

export function FoodCategoryManager({ categories }: { categories: PublicFoodCategory[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/food-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description"),
          icon: form.get("icon"),
          imageUrl: form.get("imageUrl"),
          sortOrder: form.get("sortOrder"),
          isActive: true,
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Food category created." : result?.message ?? "Could not create food category.");
      if (response.ok) {
        event.currentTarget.reset();
        router.refresh();
      }
    });
  }

  async function submitUpdate(categoryId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/food-categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          description: form.get("description"),
          icon: form.get("icon"),
          imageUrl: form.get("imageUrl"),
          sortOrder: form.get("sortOrder"),
          isActive: Boolean(form.get("isActive")),
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Food category updated." : result?.message ?? "Could not update food category.");
      if (response.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function removeCategory(category: PublicFoodCategory) {
    if (!window.confirm(`Delete ${category.name}? Existing food items will keep their old category text.`)) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/food-categories/${category.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Food category deleted." : result?.message ?? "Could not delete food category.");
      if (response.ok) router.refresh();
    });
  }

  return (
    <section className="mb-5 grid gap-3 rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[var(--ink)]">Ghanaian food categories</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">These categories control the food marketplace filters and seller food forms.</p>
        </div>
        <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[var(--brand-dark)]">
          {categories.length} categories
        </span>
      </div>

      <form onSubmit={submitCreate} className="grid gap-2 rounded-[8px] bg-[var(--surface-muted)] p-3 lg:grid-cols-[1fr_1fr_1fr_90px_auto]">
        <input name="name" required placeholder="Food category name" className="form-control bg-white px-3 text-xs" />
        <input name="slug" placeholder="custom-slug optional" className="form-control bg-white px-3 text-xs" />
        <input name="imageUrl" placeholder="Image URL optional" className="form-control bg-white px-3 text-xs" />
        <input name="sortOrder" type="number" min="0" defaultValue="200" className="form-control bg-white px-3 text-xs" />
        <Button type="submit" disabled={pending}><PlusCircle size={15} /> Add</Button>
        <input name="icon" placeholder="Short icon name, e.g. rice" className="form-control bg-white px-3 text-xs lg:col-span-2" />
        <textarea name="description" rows={2} placeholder="Short description" className="form-control bg-white px-3 py-2 text-xs lg:col-span-3" />
      </form>

      {message ? <p className="rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <article key={category.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
            {editingId === category.id ? (
              <form onSubmit={(event) => void submitUpdate(category.id, event)} className="grid gap-2">
                <input name="name" defaultValue={category.name} required className="form-control px-3 text-xs" />
                <input name="slug" defaultValue={category.slug} required className="form-control px-3 text-xs" />
                <input name="imageUrl" defaultValue={category.imageUrl ?? ""} placeholder="Image URL" className="form-control px-3 text-xs" />
                <input name="icon" defaultValue={category.icon ?? ""} placeholder="Icon name" className="form-control px-3 text-xs" />
                <input name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} className="form-control px-3 text-xs" />
                <textarea name="description" defaultValue={category.description ?? ""} rows={2} className="form-control px-3 py-2 text-xs" />
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                  <input name="isActive" type="checkbox" defaultChecked={category.isActive} className="size-4 accent-[var(--brand)]" />
                  Active
                </label>
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending} className="min-h-9 px-3"><Save size={13} /> Save</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingId(null)} className="min-h-9 px-3"><X size={13} /> Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-[var(--brand-soft)]">
                    {category.imageUrl ? (
                      <Image src={category.imageUrl} alt={category.name} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="grid h-full place-items-center text-[0.68rem] font-black uppercase text-[var(--brand-dark)]">{category.icon?.slice(0, 2) ?? "fd"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-black text-[var(--ink)]">{category.name}</h3>
                    <p className="mt-1 text-[0.68rem] font-semibold text-[var(--muted)]">{category.itemCount ?? 0} approved food item{(category.itemCount ?? 0) === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{category.description || "No description yet."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black ${category.isActive ? "bg-blue-50 text-[var(--brand-dark)]" : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[0.65rem] font-black text-[var(--muted)]">#{category.sortOrder}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditingId(category.id)} className="min-h-8 px-2.5"><Edit3 size={13} /> Edit</Button>
                  <Button type="button" variant="danger" disabled={pending} onClick={() => removeCategory(category)} className="min-h-8 px-2.5"><Trash2 size={13} /></Button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
