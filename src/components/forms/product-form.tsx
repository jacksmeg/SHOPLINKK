"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Save, Send, Trash2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { PublicCategory } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { uploadImage, uploadVideo } from "@/components/forms/upload-helper";
import { dunkwaAreas } from "@/lib/ghana";
import { formatCurrency } from "@/lib/utils";

type ProductFormValue = {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  price?: number | string;
  condition?: string;
  location?: string;
  area?: string | null;
  pickupNote?: string | null;
  stockStatus?: string;
  listingStatus?: string;
  negotiable?: boolean;
  allowCalls?: boolean;
  allowWhatsapp?: boolean;
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images?: { url: string; alt?: string | null }[];
};

export function ProductForm({
  categories,
  product,
  maxImages = 8,
}: {
  categories: PublicCategory[];
  product?: ProductFormValue | null;
  maxImages?: number;
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(product?.images?.map((image) => image.url) ?? []);
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function uploadFiles(files?: FileList | null) {
    if (!files?.length) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setMessage(`A listing can have up to ${maxImages} images.`);
      return;
    }
    setMessage("Uploading product images...");
    try {
      const selected = Array.from(files).slice(0, remaining);
      const uploaded = await Promise.all(selected.map((file) => uploadImage(file, "product")));
      setImages((current) => [...current, ...uploaded]);
      setMessage(files.length > selected.length ? `Images uploaded. Only the first ${maxImages} images can be added.` : "Images uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  async function uploadProductVideo(file?: File | null) {
    if (!file) return;
    setMessage("Uploading product video...");
    try {
      const uploaded = await uploadVideo(file);
      setVideoUrl(uploaded);
      setMessage("Video uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Video upload failed");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const listingStatus = submitter?.value === "DRAFT" ? "DRAFT" : "PENDING";
    setMessage("");

    startTransition(async () => {
      const response = await fetch(product?.id ? `/api/products/${product.id}` : "/api/products", {
        method: product?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          categoryId: formData.get("categoryId"),
          price: formData.get("price"),
          condition: formData.get("condition"),
          location: formData.get("location"),
          area: formData.get("area"),
          pickupNote: formData.get("pickupNote"),
          stockStatus: formData.get("stockStatus"),
          listingStatus,
          negotiable: Boolean(formData.get("negotiable")),
          allowCalls: Boolean(formData.get("allowCalls")),
          allowWhatsapp: Boolean(formData.get("allowWhatsapp")),
          videoUrl,
          seoTitle: formData.get("seoTitle"),
          seoDescription: formData.get("seoDescription"),
          imageUrls: images,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.message ?? "Could not save product.");
        return;
      }

      setMessage(listingStatus === "DRAFT" ? "Draft saved." : product?.id ? "Product updated for admin approval." : "Product submitted for admin approval.");
      router.push("/seller");
      router.refresh();
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form method="post" onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div className="grid gap-4">
          <label className="text-sm font-bold text-[var(--ink)]">
            Product title
            <input name="title" defaultValue={product?.title ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            Description
            <textarea name="description" defaultValue={product?.description ?? ""} required rows={6} className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[var(--ink)]">
              Category
              <select name="categoryId" defaultValue={product?.categoryId ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Price
              <input name="price" type="number" min="1" defaultValue={product?.price ? Number(product.price) : ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold text-[var(--ink)]">
              Condition
              <select name="condition" defaultValue={product?.condition ?? "USED"} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="REFURBISHED">Refurbished</option>
              </select>
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Stock
              <select name="stockStatus" defaultValue={product?.stockStatus ?? "AVAILABLE"} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </select>
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Location
              <input name="location" defaultValue={product?.location ?? "Dunkwa-on-Offin"} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[var(--ink)]">
              Area in town
              <select name="area" defaultValue={product?.area ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
                <option value="">Choose area</option>
                {dunkwaAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
              <label className="text-sm font-bold text-[var(--ink)]">
              Short product video
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  name="videoUrl"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder="https://... or upload"
                  className="min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                />
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-4 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">
                  <Video size={16} />
                  Upload
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => uploadProductVideo(event.target.files?.[0])} />
                </label>
              </div>
              <p className="mt-1 text-xs font-normal leading-5 text-[var(--muted)]">Upload MP4, WebM, or MOV up to 50MB. A short, clear inspection clip works best.</p>
              {videoUrl && (videoUrl.includes("/uploads/") || videoUrl.includes("cloudinary.com")) ? (
                <div className="mt-2 overflow-hidden rounded-[7px] border border-[var(--line)] bg-black">
                  <video controls preload="metadata" playsInline src={videoUrl} className="aspect-video w-full object-contain" aria-label="Product video preview" />
                </div>
              ) : null}
              {videoUrl ? <button type="button" onClick={() => setVideoUrl("")} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline"><Trash2 size={13} /> Remove product video</button> : null}
            </label>
          </div>
          <label className="text-sm font-bold text-[var(--ink)]">
            Pickup or delivery discussion
            <textarea name="pickupNote" defaultValue={product?.pickupNote ?? ""} rows={3} placeholder="Example: Pickup around Dunkwa Market. Delivery can be discussed in chat." className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <div className="grid gap-3 rounded-[8px] border border-[var(--line)] p-4 sm:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <input name="negotiable" type="checkbox" defaultChecked={product?.negotiable ?? true} className="size-4 accent-[var(--brand)]" />
              Negotiable price
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <input name="allowCalls" type="checkbox" defaultChecked={product?.allowCalls ?? true} className="size-4 accent-[var(--brand)]" />
              Allow calls
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <input name="allowWhatsapp" type="checkbox" defaultChecked={product?.allowWhatsapp ?? true} className="size-4 accent-[var(--brand)]" />
              Allow WhatsApp
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[var(--ink)]">
              SEO title
              <input name="seoTitle" defaultValue={product?.seoTitle ?? ""} maxLength={80} placeholder="Optional search title" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              SEO description
              <input name="seoDescription" defaultValue={product?.seoDescription ?? ""} maxLength={160} placeholder="Short Google/social description" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>
        </div>

        <aside className="rounded-[8px] bg-blue-50 p-4">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blue-300 bg-white text-sm font-black text-[var(--brand-dark)]">
            <ImagePlus size={24} />
            Upload images
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(event) => uploadFiles(event.target.files)} />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {images.map((url, index) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-[8px] bg-white">
                <Image src={url} alt="Product image" fill className="object-cover" unoptimized />
                <div className="absolute left-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    className="grid size-8 place-items-center rounded-full bg-white text-[var(--ink)] shadow"
                    aria-label="Move image up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    className="grid size-8 place-items-center rounded-full bg-white text-[var(--ink)] shadow"
                    aria-label="Move image down"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((item) => item !== url))}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white text-red-600 opacity-0 shadow transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            Add up to {maxImages} clear images. JPEG, PNG, WebP, or GIF files up to 5MB each. Sellers should not request payment before the buyer has inspected or agreed safely.
          </p>
          {product?.price ? (
            <p className="mt-3 rounded-[8px] bg-white p-3 text-sm font-black text-[var(--brand-dark)]">
              Current price: {formatCurrency(product.price)}
            </p>
          ) : null}
        </aside>
      </div>
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="PENDING" disabled={pending}>
          <Send size={17} />
          {pending ? "Saving..." : product?.id ? "Submit for review" : "Submit listing"}
        </Button>
        <Button type="submit" name="intent" value="DRAFT" variant="secondary" disabled={pending}>
          <Save size={17} />
          Save draft
        </Button>
      </div>
    </form>
  );
}
