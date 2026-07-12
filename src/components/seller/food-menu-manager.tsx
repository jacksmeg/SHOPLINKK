"use client";

import Image from "next/image";
import { PlusCircle, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";

export function FoodMenuManager() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState([{ name: "", price: "" }]);
  const [pending, startTransition] = useTransition();

  async function upload(file?: File | null) {
    if (!file) return;
    setMessage("Uploading food image...");
    try {
      setImageUrl(await uploadImage(file, "product"));
      setMessage("Food image uploaded.");
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
          basePrice: form.get("basePrice"),
          imageUrl,
          isAvailable: true,
          options: options.filter((option) => option.name.trim()).map((option) => ({ name: option.name, price: option.price || 0 })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not add food item.");
        return;
      }
      setMessage("Food item added.");
      setImageUrl("");
      setOptions([{ name: "", price: "" }]);
      (event.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="app-panel p-4 sm:p-5">
      <h2 className="text-sm font-black text-[var(--ink)]">Add food item</h2>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Add rice, meals, drinks, sides, and priced extras buyers can select.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Food name, e.g. Jollof rice" className="form-control px-3 text-xs" />
        <input name="basePrice" required type="number" min="1" placeholder="Base price" className="form-control px-3 text-xs" />
        <textarea name="description" rows={3} placeholder="Description" className="form-control px-3 py-2 text-xs sm:col-span-2" />
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black text-[var(--ink)]">Food photo</p>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] px-4 text-xs font-semibold text-[var(--ink)]">
            <UploadCloud size={15} />
            Upload
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
          </label>
        </div>
        {imageUrl ? (
          <div className="relative mt-3 aspect-[4/3] w-36 overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
            <Image src={imageUrl} alt="Food preview" fill className="object-cover" unoptimized />
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
