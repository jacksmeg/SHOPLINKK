"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LocateFixed, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  FOOD_CART_CHANGED_EVENT,
  foodCartCount,
  foodCartItemTotal,
  readFoodCart,
  writeFoodCart,
  type FoodCartItem,
} from "@/lib/food-cart";
import { formatCurrency } from "@/lib/utils";

export function FoodCartPage({
  signedIn,
  defaultName,
  defaultPhone,
}: {
  signedIn: boolean;
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const [items, setItems] = useState<FoodCartItem[]>([]);
  const [buyerName, setBuyerName] = useState(defaultName ?? "");
  const [buyerPhone, setBuyerPhone] = useState(defaultPhone ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function sync() {
      setItems(readFoodCart());
    }
    sync();
    window.addEventListener(FOOD_CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOOD_CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { storeId: string; storeName: string; storeSlug?: string; momoNumber?: string | null; items: FoodCartItem[] }>();
    for (const item of items) {
      if (!map.has(item.storeId)) {
        map.set(item.storeId, {
          storeId: item.storeId,
          storeName: item.storeName,
          storeSlug: item.storeSlug,
          momoNumber: item.momoNumber,
          items: [],
        });
      }
      map.get(item.storeId)!.items.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  const total = items.reduce((sum, item) => sum + foodCartItemTotal(item), 0);

  function save(nextItems: FoodCartItem[]) {
    setItems(nextItems);
    writeFoodCart(nextItems);
  }

  function updateQuantity(cartId: string, quantity: number) {
    save(items.map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(1, Math.min(50, quantity)) } : item));
  }

  function removeItem(cartId: string) {
    save(items.filter((item) => item.cartId !== cartId));
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
        setMessage("Location detected. Add a landmark if needed.");
        setSuccess(true);
      },
      () => {
        setMessage("Location permission was not allowed. Type your address or landmark manually.");
        setSuccess(false);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  function submitOrders() {
    setMessage("");
    setSuccess(false);
    if (!signedIn) {
      setMessage("Log in before confirming your food order.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setMessage("Enter your delivery address or detect your location.");
      return;
    }
    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    startTransition(async () => {
      const placedStoreIds: string[] = [];
      for (const group of grouped) {
        const response = await fetch(`/api/stores/${group.storeId}/food-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerName,
            buyerPhone,
            deliveryAddress,
            deliveryNote,
            paymentReference,
            items: group.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              options: item.options.map((option) => ({
                optionId: option.id,
                quantity: option.quantity,
              })),
            })),
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          setMessage(result?.message ?? `Could not place order with ${group.storeName}.`);
          setSuccess(false);
          return;
        }
        placedStoreIds.push(group.storeId);
      }

      const remaining = items.filter((item) => !placedStoreIds.includes(item.storeId));
      save(remaining);
      setMessage("Food order sent. Sellers will confirm payment and delivery status from their dashboard.");
      setSuccess(true);
      setDeliveryNote("");
      setPaymentReference("");
    });
  }

  return (
    <div className="page-enter mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Food cart</p>
          <h1 className="mt-1 text-xl font-black text-[var(--ink)]">Confirm your order</h1>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Order from one or more food sellers. Send MoMo directly to each seller and track updates in ShopLinkk.</p>
        </div>
        <div className="rounded-[8px] bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950">
          {foodCartCount(items)} item{foodCartCount(items) === 1 ? "" : "s"} / {formatCurrency(total)}
        </div>
      </div>

      {!signedIn ? (
        <div className="mb-4 rounded-[8px] border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-950">
          Please log in before checkout so sellers can track your order.
          <ButtonLink href="/login?callbackUrl=/cart" className="ml-3 mt-2 sm:mt-0" variant="secondary">Log in</ButtonLink>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          {grouped.map((group) => (
            <article key={group.storeId} className="app-panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {group.storeSlug ? (
                    <Link href={`/stores/${group.storeSlug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">
                      {group.storeName}
                    </Link>
                  ) : (
                    <h2 className="text-sm font-black text-[var(--ink)]">{group.storeName}</h2>
                  )}
                  <p className="mt-1 text-xs text-[var(--muted)]">MoMo/contact: {group.momoNumber || "seller will confirm"}</p>
                </div>
                <p className="text-sm font-black text-[var(--brand-dark)]">
                  {formatCurrency(group.items.reduce((sum, item) => sum + foodCartItemTotal(item), 0))}
                </p>
              </div>
              <div className="grid gap-3">
                {group.items.map((item) => (
                  <div key={item.cartId} className="grid gap-3 rounded-[8px] border border-[var(--line)] bg-white p-3 sm:grid-cols-[76px_1fr_auto]">
                    <div className="relative aspect-square overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized /> : null}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--ink)]">{item.name}</h3>
                      <p className="mt-1 text-xs font-bold text-[var(--brand-dark)]">{formatCurrency(item.basePrice)} each</p>
                      {item.options.length ? (
                        <ul className="mt-2 grid gap-1 text-[0.68rem] text-[var(--muted)]">
                          {item.options.map((option) => (
                            <li key={option.id}>{option.name} x {option.quantity} - {formatCurrency(option.price * option.quantity)}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="grid size-8 place-items-center rounded-[7px] border border-[var(--line)]"><Minus size={14} /></button>
                        <input value={item.quantity} onChange={(event) => updateQuantity(item.cartId, Number(event.target.value) || 1)} type="number" min="1" max="50" className="form-control w-16 px-2 text-center text-xs" />
                        <button type="button" onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="grid size-8 place-items-center rounded-[7px] border border-[var(--line)]"><Plus size={14} /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.cartId)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!items.length ? (
            <div className="app-panel p-8 text-center">
              <ShoppingCart className="mx-auto text-[var(--brand)]" size={32} />
              <h2 className="mt-3 text-sm font-black text-[var(--ink)]">Your food cart is empty</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Browse food sellers and add meals before checkout.</p>
              <ButtonLink href="/marketplace?type=food" className="mt-4">Browse food</ButtonLink>
            </div>
          ) : null}
        </section>

        <aside className="app-panel self-start p-4 lg:sticky lg:top-20">
          <h2 className="text-sm font-black text-[var(--ink)]">Delivery details</h2>
          <div className="mt-4 grid gap-3">
            <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" className="form-control px-3 text-xs" />
            <input value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="Phone number" className="form-control px-3 text-xs" />
            <div className="grid gap-2">
              <input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Delivery address, area, or detected location" className="form-control px-3 text-xs" />
              <Button type="button" variant="secondary" onClick={detectLocation}>
                <LocateFixed size={15} />
                Detect my location
              </Button>
            </div>
            <textarea value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} rows={3} placeholder="Landmark, room number, or delivery note" className="form-control resize-none px-3 py-2 text-xs" />
            <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="MoMo reference after payment (optional)" className="form-control px-3 text-xs" />
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
          <Button type="button" disabled={pending || !items.length} onClick={submitOrders} className="mt-4 w-full">
            <ShoppingCart size={16} />
            {pending ? "Sending order..." : "Confirm order"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
