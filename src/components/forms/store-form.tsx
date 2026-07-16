"use client";

import Image from "next/image";
import { Camera, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/components/forms/upload-helper";
import { ImageCropper } from "@/components/forms/image-cropper";
import { dunkwaAreas } from "@/lib/ghana";

type FoodProfile = {
  cuisineTypes?: string;
  signatureDishes?: string;
  averagePrepMinutes?: number | string | null;
  averageDeliveryMinutes?: number | string | null;
  minimumOrderAmount?: number | string | null;
  deliveryFee?: number | string | null;
  kitchenStatus?: string;
  serviceModes?: string[];
  acceptsPreorders?: boolean;
  allowsScheduledOrders?: boolean;
  packagingNote?: string;
  allergyNote?: string;
  orderInstructions?: string;
};

type StoreFormValue = {
  name?: string | null;
  kind?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  momoNumber?: string | null;
  location?: string | null;
  area?: string | null;
  address?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  openingHours?: string | null;
  socialLinks?: unknown;
  deliveryCoverage?: string | null;
  announcementBanner?: string | null;
  accentColor?: string | null;
  storeTheme?: string | null;
  acceptOrders?: boolean | null;
  vacationMode?: boolean | null;
  deliveryAvailable?: boolean | null;
  pickupAvailable?: boolean | null;
  chatEnabled?: boolean | null;
  callsEnabled?: boolean | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export function StoreForm({
  store,
  preferredKind,
}: {
  store?: StoreFormValue | null;
  preferredKind?: "GENERAL" | "FOOD";
}) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(store?.coverUrl ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedKind, setSelectedKind] = useState(store?.kind ?? preferredKind ?? "GENERAL");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const socialLinks =
    store?.socialLinks && typeof store.socialLinks === "object" && !Array.isArray(store.socialLinks)
      ? (store.socialLinks as { facebook?: string; instagram?: string; tiktok?: string; x?: string; foodProfile?: FoodProfile })
      : {};
  const foodProfile = socialLinks.foodProfile ?? {};
  const isFood = selectedKind === "FOOD";

  async function upload(target: "logo" | "cover", file?: File) {
    if (!file) return;
    setMessage("Preparing and uploading image...");
    try {
      const url = await uploadImage(file, target === "logo" ? "store-logo" : "store-cover");
      if (target === "logo") setLogoUrl(url);
      if (target === "cover") setCoverUrl(url);
      setMessage("Image cropped/resized and uploaded. Save store to keep it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  async function uploadCroppedCover(file: File) {
    setCoverFile(null);
    setMessage("Uploading your exact 1600 x 900 cover...");
    try {
      const url = await uploadImage(file, "store-cover");
      setCoverUrl(url);
      setMessage("Cover cropped and uploaded. Save store to keep it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/seller/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          kind: formData.get("kind"),
          description: formData.get("description"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          whatsapp: formData.get("whatsapp"),
          momoNumber: formData.get("momoNumber"),
          location: formData.get("location"),
          area: formData.get("area"),
          address: formData.get("address"),
          gpsLatitude: formData.get("gpsLatitude") || null,
          gpsLongitude: formData.get("gpsLongitude") || null,
          openingHours: formData.get("openingHours"),
          socialLinks: {
            facebook: String(formData.get("facebook") ?? ""),
            instagram: String(formData.get("instagram") ?? ""),
            tiktok: String(formData.get("tiktok") ?? ""),
            x: String(formData.get("x") ?? ""),
            ...(String(formData.get("kind") ?? selectedKind) === "FOOD"
              ? {
                  foodProfile: {
                    cuisineTypes: String(formData.get("foodCuisineTypes") ?? ""),
                    signatureDishes: String(formData.get("foodSignatureDishes") ?? ""),
                    averagePrepMinutes: formData.get("foodAveragePrepMinutes") || "",
                    averageDeliveryMinutes: formData.get("foodAverageDeliveryMinutes") || "",
                    minimumOrderAmount: formData.get("foodMinimumOrderAmount") || "",
                    deliveryFee: formData.get("foodDeliveryFee") || "",
                    kitchenStatus: String(formData.get("foodKitchenStatus") ?? "OPEN"),
                    serviceModes: formData.getAll("foodServiceModes").map(String),
                    acceptsPreorders: Boolean(formData.get("foodAcceptsPreorders")),
                    allowsScheduledOrders: Boolean(formData.get("foodAllowsScheduledOrders")),
                    packagingNote: String(formData.get("foodPackagingNote") ?? ""),
                    allergyNote: String(formData.get("foodAllergyNote") ?? ""),
                    orderInstructions: String(formData.get("foodOrderInstructions") ?? ""),
                  },
                }
              : {}),
          },
          deliveryCoverage: formData.get("deliveryCoverage"),
          announcementBanner: formData.get("announcementBanner"),
          accentColor: formData.get("accentColor"),
          storeTheme: formData.get("storeTheme"),
          acceptOrders: Boolean(formData.get("acceptOrders")),
          vacationMode: Boolean(formData.get("vacationMode")),
          deliveryAvailable: Boolean(formData.get("deliveryAvailable")),
          pickupAvailable: Boolean(formData.get("pickupAvailable")),
          chatEnabled: Boolean(formData.get("chatEnabled")),
          callsEnabled: Boolean(formData.get("callsEnabled")),
          seoTitle: formData.get("seoTitle"),
          seoDescription: formData.get("seoDescription"),
          logoUrl,
          coverUrl,
        }),
      });
      setMessage(response.ok ? "Store saved." : "Could not save store.");
      router.refresh();
    });
  }

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <form method="post" onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-6 shadow-sm">
      <div className={`mb-5 rounded-[8px] p-4 ${isFood ? "bg-pink-600 text-white" : "bg-[var(--brand-dark)] text-white"}`}>
        <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">{isFood ? "Food seller shop setup" : "Marketplace store setup"}</p>
        <h2 className="mt-2 text-lg font-black">{isFood ? "Build your restaurant / food shop profile" : "Build your public seller store"}</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 opacity-90">
          {isFood
            ? "Food sellers get menu, preparation time, delivery settings, order instructions, packaging notes, and buyer-ready food trust details."
            : "Product and service sellers can manage store identity, contact details, delivery coverage, verification, and buyer trust details."}
        </p>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-[8px] bg-blue-50">
        {coverUrl ? <Image src={coverUrl} alt="Store cover" fill className="object-cover" unoptimized /> : null}
        <label className="absolute bottom-3 right-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] bg-white px-4 text-xs font-semibold shadow">
          <Camera size={16} />
          Cover photo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-[var(--muted)]">
        <span>Recommended cover size: <strong className="text-[var(--ink)]">1600 x 900 px</strong> (16:9)</span>
        <span>JPEG, PNG, WebP or GIF / max 5MB</span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative grid size-20 place-items-center overflow-hidden rounded-[8px] bg-blue-50 text-[var(--brand)]">
          {logoUrl ? <Image src={logoUrl} alt="Store logo" fill className="object-cover" unoptimized /> : <Camera size={24} />}
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[var(--line)] px-4 text-xs font-semibold">
          <Camera size={16} />
          Logo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => upload("logo", event.target.files?.[0])} />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Store name
          <input name="name" defaultValue={store?.name ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Store phone
          <input name="phone" defaultValue={store?.phone ?? ""} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Store email
          <input name="email" type="email" defaultValue={store?.email ?? ""} placeholder="store@example.com" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          WhatsApp number
          <input name="whatsapp" defaultValue={store?.whatsapp ?? store?.phone ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Store type
          <select name="kind" value={selectedKind} onChange={(event) => setSelectedKind(event.target.value)} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
            <option value="GENERAL">General marketplace store</option>
            <option value="FOOD">Food seller / restaurant</option>
          </select>
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          MoMo number for direct payments
          <input name="momoNumber" defaultValue={store?.momoNumber ?? store?.phone ?? ""} placeholder="024..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Location
          <input name="location" defaultValue={store?.location ?? "Dunkwa-on-Offin"} required className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Area
          <select name="area" defaultValue={store?.area ?? ""} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
            <option value="">Choose area</option>
            {dunkwaAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          Store address or map area
          <input name="address" defaultValue={store?.address ?? ""} placeholder="Near Dunkwa Market..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          Opening hours
          <input name="openingHours" defaultValue={store?.openingHours ?? ""} placeholder="Mon-Sat, 8am-6pm" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--ink)]">
          GPS latitude
          <input name="gpsLatitude" type="number" step="any" defaultValue={store?.gpsLatitude ?? ""} placeholder="5.965..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-bold text-[var(--ink)]">
          GPS longitude
          <input name="gpsLongitude" type="number" step="any" defaultValue={store?.gpsLongitude ?? ""} placeholder="-1.78..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>
      {isFood ? (
        <div className="mt-5 rounded-[8px] border border-pink-200 bg-pink-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-pink-950">Advanced food shop settings</h2>
              <p className="mt-1 text-xs leading-5 text-pink-900">These details help buyers know what you cook, how long it takes, and how ordering should work.</p>
            </div>
            <span className="rounded-full bg-pink-600 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white">Restaurant tools</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[var(--ink)]">
              Cuisine or food types
              <input name="foodCuisineTypes" defaultValue={foodProfile.cuisineTypes ?? ""} placeholder="Ghanaian meals, rice, banku, waakye, grills..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Signature dishes
              <input name="foodSignatureDishes" defaultValue={foodProfile.signatureDishes ?? ""} placeholder="Jollof with chicken, fufu, fried rice..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Average preparation time
              <input name="foodAveragePrepMinutes" type="number" min="0" max="360" defaultValue={foodProfile.averagePrepMinutes ?? ""} placeholder="30 minutes" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Average delivery time
              <input name="foodAverageDeliveryMinutes" type="number" min="0" max="360" defaultValue={foodProfile.averageDeliveryMinutes ?? ""} placeholder="25 minutes" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Minimum order amount
              <input name="foodMinimumOrderAmount" type="number" min="0" defaultValue={foodProfile.minimumOrderAmount ?? ""} placeholder="Example: 20" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Default delivery fee
              <input name="foodDeliveryFee" type="number" min="0" defaultValue={foodProfile.deliveryFee ?? ""} placeholder="Example: 8" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Kitchen status
              <select name="foodKitchenStatus" defaultValue={foodProfile.kitchenStatus ?? "OPEN"} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
                <option value="OPEN">Open for orders</option>
                <option value="BUSY">Busy but accepting orders</option>
                <option value="CLOSING_SOON">Closing soon</option>
                <option value="CLOSED">Temporarily closed</option>
              </select>
            </label>
            <div className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <p className="text-sm font-bold text-[var(--ink)]">Food service modes</p>
              <div className="mt-3 grid gap-2 text-xs font-bold text-[var(--ink)]">
                {["Delivery", "Pickup", "Pre-order", "Scheduled orders", "Office lunch", "Party orders"].map((mode) => (
                  <label key={mode} className="flex items-center gap-2">
                    <input name="foodServiceModes" type="checkbox" value={mode} defaultChecked={foodProfile.serviceModes?.includes(mode)} className="size-4 accent-[var(--brand)]" />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--ink)]">
              <input name="foodAcceptsPreorders" type="checkbox" defaultChecked={foodProfile.acceptsPreorders ?? false} className="size-4 accent-[var(--brand)]" />
              Accept pre-orders
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--ink)]">
              <input name="foodAllowsScheduledOrders" type="checkbox" defaultChecked={foodProfile.allowsScheduledOrders ?? false} className="size-4 accent-[var(--brand)]" />
              Allow scheduled orders
            </label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label className="text-sm font-bold text-[var(--ink)]">
              Packaging note
              <textarea name="foodPackagingNote" defaultValue={foodProfile.packagingNote ?? ""} rows={3} placeholder="Example: Meals are sealed and packed separately." className="mt-2 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Allergy / spice note
              <textarea name="foodAllergyNote" defaultValue={foodProfile.allergyNote ?? ""} rows={3} placeholder="Example: Tell us if you do not want pepper, onions, or groundnut." className="mt-2 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-bold text-[var(--ink)]">
              Order instructions
              <textarea name="foodOrderInstructions" defaultValue={foodProfile.orderInstructions ?? ""} rows={3} placeholder="Example: Buyer should confirm MoMo payment before preparation starts." className="mt-2 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
            </label>
          </div>
        </div>
      ) : null}
      <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
        Description
        <textarea name="description" defaultValue={store?.description ?? ""} rows={4} className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </label>
      <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
        Delivery coverage area
        <textarea name="deliveryCoverage" defaultValue={store?.deliveryCoverage ?? ""} rows={3} placeholder="Dunkwa market, Atechem, Abankesieso, Jukwa..." className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </label>
      <label className="mt-4 block text-sm font-bold text-[var(--ink)]">
        Announcement banner
        <input name="announcementBanner" defaultValue={store?.announcementBanner ?? ""} placeholder="10% off all phones this weekend" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
      </label>

      <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Store theme and social links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--ink)]">
            Accent colour
            <input name="accentColor" type="color" defaultValue={store?.accentColor ?? "#0f3b78"} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-2" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            Store theme
            <select name="storeTheme" defaultValue={store?.storeTheme ?? "clean"} className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100">
              <option value="clean">Clean white</option>
              <option value="bold">Bold blue</option>
              <option value="food">Food seller</option>
              <option value="premium">Premium store</option>
            </select>
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            Facebook
            <input name="facebook" defaultValue={socialLinks.facebook ?? ""} placeholder="https://facebook.com/..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            Instagram
            <input name="instagram" defaultValue={socialLinks.instagram ?? ""} placeholder="https://instagram.com/..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            TikTok
            <input name="tiktok" defaultValue={socialLinks.tiktok ?? ""} placeholder="https://tiktok.com/@..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            X / Twitter
            <input name="x" defaultValue={socialLinks.x ?? ""} placeholder="https://x.com/..." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
        </div>
      </div>

      <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-white p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Store settings</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["acceptOrders", "Accept orders", store?.acceptOrders ?? true],
            ["vacationMode", "Vacation mode", store?.vacationMode ?? false],
            ["deliveryAvailable", "Delivery available", store?.deliveryAvailable ?? true],
            ["pickupAvailable", "Pickup available", store?.pickupAvailable ?? true],
            ["chatEnabled", "Chat enabled", store?.chatEnabled ?? true],
            ["callsEnabled", "Phone calls enabled", store?.callsEnabled ?? true],
          ].map(([name, label, checked]) => (
            <label key={String(name)} className="flex min-h-12 items-center gap-3 rounded-[8px] border border-[var(--line)] px-3 text-xs font-black text-[var(--ink)]">
              <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} className="size-4 accent-[var(--brand)]" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-white p-4">
        <h2 className="text-sm font-black text-[var(--ink)]">Store SEO and sharing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--ink)]">
            SEO title
            <input name="seoTitle" defaultValue={store?.seoTitle ?? ""} placeholder="Kofi Electronics in Dunkwa-on-Offin" className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="text-sm font-bold text-[var(--ink)]">
            SEO description
            <input name="seoDescription" defaultValue={store?.seoDescription ?? ""} placeholder="Trusted local shop for phones, accessories, and repairs." className="mt-2 min-h-12 w-full rounded-[8px] border border-[var(--line)] px-3 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100" />
          </label>
        </div>
      </div>
      {message ? <p className="mt-4 rounded-[8px] bg-blue-50 p-3 text-sm font-semibold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-5">
        <Save size={17} />
        {pending ? "Saving..." : "Save store"}
      </Button>
      {coverFile ? <ImageCropper file={coverFile} width={1600} height={900} title="Crop store cover photo" onCancel={() => setCoverFile(null)} onComplete={(file) => void uploadCroppedCover(file)} /> : null}
    </form>
  );
}
