"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LocateFixed, Minus, PackageCheck, Phone, Plus, ReceiptText, ShoppingBag, ShoppingCart, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  PRODUCT_CART_CHANGED_EVENT,
  productCartCount,
  productCartItemPrice,
  productCartItemTotal,
  readProductCart,
  writeProductCart,
  type ProductCartItem,
} from "@/lib/product-cart";
import { formatGhanaPhone } from "@/lib/ghana";
import { formatCurrency } from "@/lib/utils";

export function ProductCartSection({
  signedIn,
  defaultName,
  defaultPhone,
}: {
  signedIn: boolean;
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const [items, setItems] = useState<ProductCartItem[]>([]);
  const [buyerName, setBuyerName] = useState(defaultName ?? "");
  const [buyerPhone, setBuyerPhone] = useState(defaultPhone ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [buyerPaymentNote, setBuyerPaymentNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<{ id: string; storeName: string; momoNumber?: string | null }[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function sync() {
      setItems(readProductCart());
    }
    sync();
    window.addEventListener(PRODUCT_CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PRODUCT_CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, {
      key: string;
      sellerId?: string | null;
      storeId?: string | null;
      storeName: string;
      storeSlug?: string | null;
      momoNumber?: string | null;
      sellerPhone?: string | null;
      items: ProductCartItem[];
    }>();
    for (const item of items) {
      const key = item.storeId || item.sellerId || item.storeSlug || item.storeName || "seller";
      if (!map.has(key)) {
        map.set(key, {
          key,
          sellerId: item.sellerId,
          storeId: item.storeId,
          storeName: item.storeName || "Seller",
          storeSlug: item.storeSlug,
          momoNumber: item.momoNumber,
          sellerPhone: item.sellerPhone,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  const total = useMemo(() => items.reduce((sum, item) => sum + productCartItemTotal(item), 0), [items]);

  function save(nextItems: ProductCartItem[]) {
    setItems(nextItems);
    writeProductCart(nextItems);
  }

  function updateQuantity(productId: string, quantity: number) {
    save(items.map((item) => {
      if (item.productId !== productId) return item;
      const max = item.maxQuantity ?? 99;
      return { ...item, quantity: Math.max(1, Math.min(max, quantity)) };
    }));
  }

  function removeItem(productId: string) {
    save(items.filter((item) => item.productId !== productId));
  }

  function detectLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Location detection is not available. Type your address manually.");
      setSuccess(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryAddress(`Detected location: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        setMessage("Location detected. Add a nearby landmark before confirming.");
        setSuccess(true);
      },
      () => {
        setMessage("Location permission was not allowed. Type your address or landmark manually.");
        setSuccess(false);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  async function uploadProof(file?: File | null) {
    if (!file) return;
    setMessage("");
    setUploading(true);
    try {
      const url = await uploadImage(file, "payment-proof");
      setPaymentProofUrl(url);
      setMessage("Payment proof uploaded.");
      setSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload payment proof.");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  }

  function submitOrder() {
    setMessage("");
    setSuccess(false);
    if (!signedIn) {
      setMessage("Log in before confirming your marketplace order.");
      return;
    }
    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setMessage("Enter your pickup or delivery address.");
      return;
    }
    setPlacedOrders([]);

    startTransition(async () => {
      const response = await fetch("/api/marketplace-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          deliveryAddress,
          deliveryNote,
          paymentReference,
          paymentProofUrl,
          buyerPaymentNote,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not create your marketplace order.");
        setSuccess(false);
        return;
      }

      const productIds = new Set<string>(
        (result?.orders ?? []).flatMap((order: { productIds?: string[] }) => order.productIds ?? []),
      );
      save(items.filter((item) => !productIds.has(item.productId)));
      setPlacedOrders(result?.orders ?? []);
      setPaymentReference("");
      setPaymentProofUrl("");
      setBuyerPaymentNote("");
      setMessage("Marketplace order created. Sellers will confirm payment from their dashboard.");
      setSuccess(true);
    });
  }

  return (
    <section className="mb-6 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Marketplace cart</p>
          <h2 className="mt-1 text-lg font-black text-[var(--ink)]">Direct seller MoMo checkout</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Pay sellers directly to their MoMo number, then submit the reference or proof here for confirmation.</p>
        </div>
        <div className="rounded-[8px] bg-cyan-600 px-4 py-3 text-sm font-black text-white">
          {productCartCount(items)} item{productCartCount(items) === 1 ? "" : "s"} / {formatCurrency(total)}
        </div>
      </div>

      {!signedIn ? (
        <div className="mb-4 rounded-[8px] border border-cyan-700 bg-cyan-700 p-3 text-xs font-semibold leading-5 text-white">
          Please log in before checkout so sellers can confirm your order.
          <ButtonLink href="/login?callbackUrl=/cart" className="ml-3 mt-2 sm:mt-0" variant="secondary">Log in</ButtonLink>
        </div>
      ) : null}

      {items.length ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3">
            {grouped.map((group) => (
              <article key={group.key} className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {group.storeSlug ? (
                      <Link href={`/stores/${group.storeSlug}`} className="inline-flex rounded-full bg-[var(--brand-dark)] px-3 py-1.5 text-xs font-black text-white">
                        {group.storeName}
                      </Link>
                    ) : (
                      <p className="text-sm font-black text-[var(--ink)]">{group.storeName}</p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                      MoMo/contact: <span className="text-[var(--ink)]">{group.momoNumber || group.sellerPhone || "Seller will confirm"}</span>
                    </p>
                  </div>
                  <p className="text-sm font-black text-[var(--brand-dark)]">
                    {formatCurrency(group.items.reduce((sum, item) => sum + productCartItemTotal(item), 0))}
                  </p>
                </div>
                <div className="grid gap-3">
                  {group.items.map((item) => (
                    <div key={item.productId} className="grid gap-3 rounded-[8px] border border-[var(--line)] bg-white p-3 sm:grid-cols-[82px_minmax(0,1fr)_auto]">
                      <Link href={`/products/${item.slug}`} className="relative aspect-square overflow-hidden rounded-[7px] bg-white">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <ShoppingBag className="m-auto mt-7 text-[var(--muted)]" />}
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{item.title}</Link>
                        <p className="mt-2 text-xs font-black text-[var(--brand-dark)]">{formatCurrency(productCartItemPrice(item))} each</p>
                        {item.maxQuantity ? <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{item.maxQuantity} unit{item.maxQuantity === 1 ? "" : "s"} listed by seller</p> : null}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="grid size-8 place-items-center rounded-[7px] border border-[var(--line)] bg-white"><Minus size={14} /></button>
                          <input value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value) || 1)} type="number" min="1" max={item.maxQuantity ?? 99} className="form-control w-16 px-2 text-center text-xs" />
                          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="grid size-8 place-items-center rounded-[7px] border border-[var(--line)] bg-white"><Plus size={14} /></button>
                        </div>
                        <p className="text-sm font-black text-[var(--ink)]">{formatCurrency(productCartItemTotal(item))}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.sellerPhone ? (
                            <ButtonLink href={`tel:${formatGhanaPhone(item.sellerPhone)}`} variant="secondary" className="min-h-8 px-2.5"><Phone size={13} /> Call</ButtonLink>
                          ) : null}
                          <button type="button" onClick={() => removeItem(item.productId)} className="inline-flex min-h-8 items-center gap-1.5 rounded-[7px] bg-red-600 px-2.5 text-xs font-bold text-white">
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="app-panel self-start p-4 lg:sticky lg:top-20">
            <h3 className="flex items-center gap-2 text-sm font-black text-[var(--ink)]">
              <ReceiptText size={17} className="text-[var(--brand)]" />
              Buyer and payment details
            </h3>
            <div className="mt-4 grid gap-3">
              <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" className="form-control px-3 text-xs" />
              <input value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="Phone number" className="form-control px-3 text-xs" />
              <div className="grid gap-2">
                <input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Pickup/delivery address or area" className="form-control px-3 text-xs" />
                <Button type="button" variant="secondary" onClick={detectLocation}>
                  <LocateFixed size={15} />
                  Detect my location
                </Button>
              </div>
              <textarea value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} rows={3} placeholder="Delivery note, landmark, or seller instruction" className="form-control resize-none px-3 py-2 text-xs" />
              <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="MoMo transaction ID/reference" className="form-control px-3 text-xs" />
              <textarea value={buyerPaymentNote} onChange={(event) => setBuyerPaymentNote(event.target.value)} rows={3} placeholder="Optional payment note, e.g. paid from 054..." className="form-control resize-none px-3 py-2 text-xs" />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed border-[var(--line-strong)] bg-white px-3 py-3 text-xs font-bold text-[var(--brand-dark)]">
                <UploadCloud size={16} />
                {uploading ? "Uploading proof..." : paymentProofUrl ? "Proof uploaded. Choose another" : "Upload payment proof"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => uploadProof(event.target.files?.[0])} />
              </label>
            </div>
            <div className="mt-4 rounded-[8px] bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--muted)]">Total</span>
                <span className="text-lg font-black text-[var(--brand-dark)]">{formatCurrency(total)}</span>
              </div>
            </div>
            {message ? (
              <p className={`mt-3 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${success ? "bg-blue-50 text-[var(--brand-dark)]" : "bg-red-50 text-red-700"}`}>
                <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
                {message}
              </p>
            ) : null}
            {placedOrders.length ? (
              <div className="mt-3 grid gap-2">
                {placedOrders.map((order) => (
                  <Link key={order.id} href="/buyer/orders" className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--brand-dark)] hover:border-[var(--brand)]">
                    {order.storeName} order created {order.momoNumber ? `- MoMo ${order.momoNumber}` : ""}
                  </Link>
                ))}
              </div>
            ) : null}
            <Button type="button" disabled={pending || uploading || !items.length} onClick={submitOrder} className="mt-4 w-full">
              <ShoppingCart size={16} />
              {pending ? "Creating order..." : "Confirm direct MoMo order"}
            </Button>
          </aside>
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[var(--line)] p-5 text-center">
          <PackageCheck className="mx-auto text-[var(--brand)]" size={26} />
          <p className="mt-2 text-sm font-black text-[var(--ink)]">No marketplace products in cart yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Add fixed-price products from the marketplace, then confirm direct payment here.</p>
          <ButtonLink href="/marketplace" className="mt-4" variant="secondary">Browse marketplace</ButtonLink>
        </div>
      )}
    </section>
  );
}
