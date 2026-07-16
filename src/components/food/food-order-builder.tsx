"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LocateFixed, Minus, Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { foodCartItemTotal, makeCartId, readFoodCart, writeFoodCart, type FoodCartItem } from "@/lib/food-cart";
import { formatCurrency } from "@/lib/utils";

type FoodOption = { id: string; name: string; price: number };
type FoodOrderItem = {
  id: string;
  name: string;
  category?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  images: { id: string; url: string; alt?: string | null }[];
  prepMinutes?: number | null;
  deliveryMinutes?: number | null;
  options: FoodOption[];
};

type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  momoNumber?: string | null;
  phone?: string | null;
};

export function FoodOrderBuilder({
  item,
  store,
}: {
  item: FoodOrderItem;
  store: StoreSummary;
}) {
  const [quantity, setQuantity] = useState(1);
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");
  const cover = item.images[0]?.url ?? item.imageUrl ?? "/window.svg";
  const estimate = Number(item.prepMinutes ?? 0) + Number(item.deliveryMinutes ?? 0);

  const cartItem = useMemo<FoodCartItem>(() => ({
    cartId: makeCartId(),
    itemId: item.id,
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    momoNumber: store.momoNumber ?? store.phone,
    name: item.name,
    category: item.category,
    imageUrl: cover,
    basePrice: item.basePrice,
    quantity,
    prepMinutes: item.prepMinutes,
    deliveryMinutes: item.deliveryMinutes,
    options: item.options
      .map((option) => ({
        id: option.id,
        name: option.name,
        price: option.price,
        quantity: optionQuantities[option.id] ?? 0,
      }))
      .filter((option) => option.quantity > 0),
    addedAt: new Date().toISOString(),
  }), [cover, item, optionQuantities, quantity, store]);

  const total = foodCartItemTotal(cartItem);

  function changeOption(optionId: string, nextQuantity: number) {
    setOptionQuantities((current) => ({
      ...current,
      [optionId]: Math.max(0, Math.min(50, nextQuantity)),
    }));
  }

  function detectLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Your browser could not detect location. Enter your area manually at checkout.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lng = position.coords.longitude.toFixed(5);
        setDeliveryAddress(`Detected location: ${lat}, ${lng}`);
        setMessage("Location added to this order. You can refine it in the cart.");
      },
      () => setMessage("Location permission was not allowed. You can type your address in the cart."),
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  function addToCart() {
    const items = readFoodCart();
    writeFoodCart([...items, { ...cartItem, cartId: makeCartId() }]);
    setMessage(`${item.name} has been added to your cart.`);
  }

  return (
    <div className="app-panel p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-[var(--surface-muted)]">
            <Image src={cover} alt={item.name} fill className="object-cover" unoptimized />
          </div>
          {estimate ? (
            <p className="mt-3 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-bold text-[var(--brand-dark)]">
              Estimated delivery: {estimate} minutes
            </p>
          ) : null}
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Build your order</p>
              <h2 className="mt-1 text-lg font-black text-[var(--ink)]">{item.name}</h2>
              <Link href={`/stores/${store.slug}`} className="mt-1 inline-block text-xs font-black text-[var(--brand-dark)]">
                {store.name}
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-[8px] border border-[var(--line)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-3">
              <div>
                <p className="text-xs font-black text-[var(--ink)]">Food quantity</p>
                <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{formatCurrency(item.basePrice)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-[7px] border border-[var(--line)] bg-white text-[var(--brand-dark)]" aria-label="Reduce quantity"><Minus size={15} /></button>
                <input value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} type="number" min="1" max="50" className="form-control w-20 px-2 text-center text-xs" />
                <button type="button" onClick={() => setQuantity((value) => Math.min(50, value + 1))} className="grid size-9 place-items-center rounded-[7px] border border-[var(--line)] bg-white text-[var(--brand-dark)]" aria-label="Increase quantity"><Plus size={15} /></button>
              </div>
            </div>

            {item.options.length ? (
              <div className="p-3">
                <p className="text-xs font-black text-[var(--ink)]">Add-ons</p>
                <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--line)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-muted)] text-[0.68rem] uppercase tracking-[0.08em] text-[var(--muted-strong)]">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {item.options.map((option) => (
                        <tr key={option.id}>
                          <td className="px-3 py-2 font-bold text-[var(--ink)]">{option.name}</td>
                          <td className="px-3 py-2 font-bold text-[var(--brand-dark)]">{formatCurrency(option.price)}</td>
                          <td className="px-3 py-2">
                            <input
                              value={optionQuantities[option.id] ?? 0}
                              onChange={(event) => changeOption(option.id, Number(event.target.value) || 0)}
                              min="0"
                              max="50"
                              type="number"
                              className="form-control ml-auto w-20 px-2 text-right text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Detected location or delivery area" className="form-control px-3 text-xs" />
            <Button type="button" variant="secondary" onClick={detectLocation}>
              <LocateFixed size={15} />
              Detect location
            </Button>
          </div>

          {message ? (
            <p className="mt-3 flex items-start gap-2 rounded-[8px] bg-blue-50 p-3 text-xs font-semibold text-[var(--brand-dark)]">
              <CheckCircle2 className="mt-0.5 shrink-0" size={15} />
              {message}
            </p>
          ) : null}

          <div className="mt-5 rounded-[10px] bg-yellow-400 p-4 text-slate-950">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.08em]">Total item price</span>
              <span className="text-xl font-black">{formatCurrency(total)}</span>
            </div>
            <p className="mt-1 text-[0.68rem] font-bold">Add to cart first. Payment details show after the seller confirms the order.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={addToCart}>
              <ShoppingCart size={16} />
              Add to cart
            </Button>
            <ButtonLink href="/cart" variant="secondary">View cart</ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
