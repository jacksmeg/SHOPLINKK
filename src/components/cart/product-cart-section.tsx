"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, PackageCheck, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
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

export function ProductCartSection() {
  const [items, setItems] = useState<ProductCartItem[]>([]);

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

  return (
    <section className="mb-6 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Marketplace cart</p>
          <h2 className="mt-1 text-lg font-black text-[var(--ink)]">Products and services</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Save marketplace items here, then call or chat with each seller before paying.</p>
        </div>
        <div className="rounded-[8px] bg-cyan-600 px-4 py-3 text-sm font-black text-white">
          {productCartCount(items)} item{productCartCount(items) === 1 ? "" : "s"} / {formatCurrency(total)}
        </div>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.productId} className="grid gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 sm:grid-cols-[82px_minmax(0,1fr)_auto]">
              <Link href={`/products/${item.slug}`} className="relative aspect-square overflow-hidden rounded-[7px] bg-white">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <ShoppingBag className="m-auto mt-7 text-[var(--muted)]" />}
              </Link>
              <div className="min-w-0">
                <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-black text-[var(--ink)] hover:text-[var(--brand-dark)]">{item.title}</Link>
                {item.storeSlug ? (
                  <Link href={`/stores/${item.storeSlug}`} className="mt-1 inline-flex rounded-full bg-[var(--brand-dark)] px-2.5 py-1 text-[0.68rem] font-black text-white">
                    {item.storeName || "Seller store"}
                  </Link>
                ) : item.storeName ? (
                  <p className="mt-1 text-[0.68rem] font-bold text-[var(--muted)]">{item.storeName}</p>
                ) : null}
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
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[var(--line)] p-5 text-center">
          <PackageCheck className="mx-auto text-[var(--brand)]" size={26} />
          <p className="mt-2 text-sm font-black text-[var(--ink)]">No marketplace products in cart yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Add fixed-price products from the marketplace, then contact sellers directly.</p>
          <ButtonLink href="/marketplace" className="mt-4" variant="secondary">Browse marketplace</ButtonLink>
        </div>
      )}
    </section>
  );
}
