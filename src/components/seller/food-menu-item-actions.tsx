"use client";

import Image from "next/image";
import { Edit3, Eye, EyeOff, PlusCircle, Save, Send, Trash2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import type { PublicFoodCategory } from "@/lib/food-categories";

type FoodOption = { id: string; name: string; price: number };
type FoodImage = { id: string; url: string; alt?: string | null; sortOrder: number };

export function FoodMenuItemActions({
  item,
  categories,
}: {
  item: {
    id: string;
    name: string;
    description?: string | null;
    foodCategoryId?: string | null;
    category?: string | null;
    basePrice: number;
    prepMinutes?: number | null;
    deliveryMinutes?: number | null;
    isSpicy: boolean;
    isVegetarian: boolean;
    isAvailable: boolean;
    status: string;
    images: FoodImage[];
    imageUrl?: string | null;
    options: FoodOption[];
  };
  categories: PublicFoodCategory[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(item.images.length ? item.images.map((image) => image.url) : item.imageUrl ? [item.imageUrl] : []);
  const [options, setOptions] = useState(item.options.length ? item.options.map((option) => ({ name: option.name, price: String(option.price) })) : [{ name: "", price: "" }]);
  const [pending, startTransition] = useTransition();

  async function upload(files?: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    if (imageUrls.length + list.length > 8) {
      setMessage("Upload 8 food photos or fewer.");
      return;
    }
    setMessage("Uploading...");
    try {
      const uploaded: string[] = [];
      for (const file of list) uploaded.push(await uploadImage(file, "product"));
      setImageUrls((current) => [...current, ...uploaded]);
      setMessage("Images uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  function updateAvailability() {
    startTransition(async () => {
      const response = await fetch(`/api/seller/food/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Availability updated." : result?.message ?? "Could not update item.");
      if (response.ok) router.refresh();
    });
  }

  function removeItem() {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    startTransition(async () => {
      const response = await fetch(`/api/seller/food/menu/${item.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Food item deleted." : result?.message ?? "Could not delete item.");
      if (response.ok) router.refresh();
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await fetch(`/api/seller/food/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          foodCategoryId: form.get("foodCategoryId"),
          description: form.get("description"),
          basePrice: form.get("basePrice"),
          prepMinutes: form.get("prepMinutes"),
          deliveryMinutes: form.get("deliveryMinutes"),
          isSpicy: Boolean(form.get("isSpicy")),
          isVegetarian: Boolean(form.get("isVegetarian")),
          isAvailable: Boolean(form.get("isAvailable")),
          status: form.get("status") === "DRAFT" ? "DRAFT" : "PENDING",
          submitForApproval: form.get("status") !== "DRAFT",
          imageUrls,
          options: options.filter((option) => option.name.trim()).map((option) => ({ name: option.name, price: option.price || 0 })),
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Food item saved and sent for review." : result?.message ?? "Could not save food item.");
      if (response.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={submit} className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="name" defaultValue={item.name} required className="form-control px-3 text-xs" />
          <select name="foodCategoryId" defaultValue={item.foodCategoryId ?? ""} className="form-control bg-white px-3 text-xs">
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input name="basePrice" defaultValue={item.basePrice} type="number" min="1" required className="form-control px-3 text-xs" />
          <input name="prepMinutes" defaultValue={item.prepMinutes ?? ""} type="number" min="1" max="240" placeholder="Prep minutes" className="form-control px-3 text-xs" />
          <input name="deliveryMinutes" defaultValue={item.deliveryMinutes ?? ""} type="number" min="1" max="240" placeholder="Delivery minutes" className="form-control px-3 text-xs" />
          <textarea name="description" defaultValue={item.description ?? ""} rows={3} className="form-control px-3 py-2 text-xs sm:col-span-2" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isAvailable" type="checkbox" defaultChecked={item.isAvailable} className="size-4 accent-[var(--brand)]" /> Available</label>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isSpicy" type="checkbox" defaultChecked={item.isSpicy} className="size-4 accent-[var(--brand)]" /> Spicy</label>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isVegetarian" type="checkbox" defaultChecked={item.isVegetarian} className="size-4 accent-[var(--brand)]" /> Vegetarian</label>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="status" type="checkbox" value="DRAFT" defaultChecked={item.status === "DRAFT"} className="size-4 accent-[var(--brand)]" /> Save draft</label>
        </div>
        <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black text-[var(--ink)]">Food photos</p>
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] px-3 text-xs font-semibold">
              <UploadCloud size={14} /> Upload
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void upload(event.target.files)} />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                <button type="button" onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white text-red-600">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black text-[var(--ink)]">Add-ons</p>
          </div>
          <div className="mt-2 grid gap-2">
            {options.map((option, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
                <input value={option.name} onChange={(event) => setOptions((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry))} placeholder="Extra meat" className="form-control px-3 text-xs" />
                <input value={option.price} onChange={(event) => setOptions((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, price: event.target.value } : entry))} type="number" min="0" placeholder="Price" className="form-control px-3 text-xs" />
                <button type="button" onClick={() => setOptions((current) => current.filter((_, entryIndex) => entryIndex !== index))} className="grid size-10 place-items-center rounded-[7px] border border-[var(--line)] text-red-600"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOptions((current) => [...current, { name: "", price: "" }])}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-[8px] bg-[var(--brand-dark)] px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5"
          >
            <PlusCircle size={14} />
            Add option
          </button>
        </div>
        {message ? <p className="mt-3 text-xs font-semibold text-[var(--muted)]">{message}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}><Save size={14} /> Save</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditing(true)} className="min-h-8 px-2.5"><Edit3 size={13} /> Edit</Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={updateAvailability} className="min-h-8 px-2.5">{item.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />} {item.isAvailable ? "Hide" : "Show"}</Button>
      {item.status === "DRAFT" || item.status === "REJECTED" ? (
        <Button type="button" disabled={pending} onClick={() => setEditing(true)} className="min-h-8 px-2.5"><Send size={13} /> Edit & submit</Button>
      ) : null}
      <Button type="button" variant="danger" disabled={pending} onClick={removeItem} className="min-h-8 px-2.5"><Trash2 size={13} /></Button>
      {message ? <p className="basis-full text-xs font-semibold text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
