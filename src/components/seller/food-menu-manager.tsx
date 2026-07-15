"use client";

import Image from "next/image";
import { ChefHat, PlusCircle, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import type { PublicFoodCategory } from "@/lib/food-categories";

export function FoodMenuManager({ categories }: { categories: PublicFoodCategory[] }) {
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState([{ name: "", price: "" }]);
  const [pending, startTransition] = useTransition();

  async function upload(files?: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    if (imageUrls.length + list.length > 8) {
      setMessage("Upload 8 food photos or fewer.");
      return;
    }
    setMessage("Uploading food images...");
    try {
      const uploaded: string[] = [];
      for (const file of list) uploaded.push(await uploadImage(file, "product"));
      setImageUrls((current) => [...current, ...uploaded]);
      setMessage("Food images uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/seller/food/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          foodCategoryId: form.get("foodCategoryId"),
          basePrice: form.get("basePrice"),
          imageUrls,
          prepMinutes: form.get("prepMinutes"),
          deliveryMinutes: form.get("deliveryMinutes"),
          isSpicy: Boolean(form.get("isSpicy")),
          isVegetarian: Boolean(form.get("isVegetarian")),
          isAvailable: true,
          status: form.get("status") === "DRAFT" ? "DRAFT" : "PENDING",
          options: options.filter((option) => option.name.trim()).map((option) => ({ name: option.name, price: option.price || 0 })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not add food item.");
        return;
      }
      setMessage("Food item submitted. Admin will approve it before buyers can order.");
      setImageUrls([]);
      setOptions([{ name: "", price: "" }]);
      (event.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="app-panel p-4 sm:p-5">
      <div className="rounded-[8px] bg-pink-600 p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-white/15">
            <ChefHat size={19} />
          </span>
          <div>
            <h2 className="text-sm font-black">Food menu form</h2>
            <p className="mt-1 text-xs leading-5 opacity-90">Use this only for meals, drinks, sides, add-ons, preparation time, delivery estimates, and food photos.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Food name, e.g. Jollof rice" className="form-control px-3 text-xs" />
        <select name="foodCategoryId" required className="form-control bg-white px-3 text-xs">
          <option value="">Choose Ghanaian food category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <input name="basePrice" required type="number" min="1" placeholder="Base price" className="form-control px-3 text-xs" />
        <input name="prepMinutes" type="number" min="1" max="240" placeholder="Prep time in minutes" className="form-control px-3 text-xs" />
        <input name="deliveryMinutes" type="number" min="1" max="240" placeholder="Delivery estimate in minutes" className="form-control px-3 text-xs" />
        <textarea name="description" rows={3} placeholder="Description" className="form-control px-3 py-2 text-xs sm:col-span-2" />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isSpicy" type="checkbox" className="size-4 accent-[var(--brand)]" /> Spicy option</label>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="isVegetarian" type="checkbox" className="size-4 accent-[var(--brand)]" /> Vegetarian friendly</label>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><input name="status" type="checkbox" value="DRAFT" className="size-4 accent-[var(--brand)]" /> Save as draft</label>
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black text-[var(--ink)]">Food photo</p>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] px-4 text-xs font-semibold text-[var(--ink)]">
            <UploadCloud size={15} />
            Upload
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void upload(event.target.files)} />
          </label>
        </div>
        {imageUrls.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                <Image src={url} alt={`Food preview ${index + 1}`} fill className="object-cover" unoptimized />
                <button type="button" onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm" aria-label="Remove food photo">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--line)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black text-[var(--ink)]">Add-ons</p>
          <button type="button" className="text-xs font-bold text-[var(--brand-dark)]" onClick={() => setOptions((current) => [...current, { name: "", price: "" }])}>Add option</button>
        </div>
        <div className="mt-3 grid gap-2">
          {options.map((option, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input value={option.name} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Meat, sausage, egg..." className="form-control px-3 text-xs" />
              <input value={option.price} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} type="number" min="0" placeholder="Price" className="form-control px-3 text-xs" />
              <button type="button" className="grid size-10 place-items-center rounded-[7px] border border-[var(--line)] text-red-600" onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {message ? <p className="mt-3 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-4">
        <PlusCircle size={16} />
        {pending ? "Saving..." : "Add food item"}
      </Button>
    </form>
  );
}
