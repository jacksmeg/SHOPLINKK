"use client";

import Image from "next/image";
import { CheckCircle2, ShoppingBasket } from "lucide-react";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type MenuOption = { id: string; name: string; price: number };
type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  options: MenuOption[];
};

export function FoodOrderWidget({
  storeId,
  momoNumber,
  items,
}: {
  storeId: string;
  momoNumber?: string | null;
  items: MenuItem[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = quantities[item.id] ?? 0;
      const selectedOptions = options[item.id] ?? [];
      const optionTotal = item.options
        .filter((option) => selectedOptions.includes(option.id))
        .reduce((optionSum, option) => optionSum + option.price, 0);
      return sum + quantity * (item.basePrice + optionTotal);
    }, 0);
  }, [items, options, quantities]);

  function toggleOption(itemId: string, optionId: string) {
    setOptions((current) => {
      const selected = current[itemId] ?? [];
      return {
        ...current,
        [itemId]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    const orderItems = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        itemId,
        quantity,
        optionIds: options[itemId] ?? [],
      }));

    if (!orderItems.length) {
      setMessage("Choose at least one food item.");
      return;
    }

    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await fetch(`/api/stores/${storeId}/food-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: form.get("buyerName"),
          buyerPhone: form.get("buyerPhone"),
          deliveryAddress: form.get("deliveryAddress"),
          deliveryNote: form.get("deliveryNote"),
          paymentReference: form.get("paymentReference"),
          items: orderItems,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not place the food order.");
        return;
      }
      setSuccess(true);
      setMessage(`Order placed. Send ${formatCurrency(total)} to ${momoNumber || "the seller MoMo number"}, then track it from your buyer dashboard.`);
    });
  }

  if (!items.length) return null;

  return (
    <form onSubmit={submit} className="app-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--tone-pink)]">Food ordering</p>
          <h2 className="mt-1 text-lg font-black text-[var(--ink)]">Build your order</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Choose food items and send MoMo directly to the seller.</p>
        </div>
        <span className="rounded-[8px] bg-yellow-400 px-3 py-2 text-xs font-black text-slate-950">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[8px] border border-[var(--line)] bg-white p-3">
            <div className="grid gap-3 sm:grid-cols-[92px_1fr_auto] sm:items-start">
              <div className="relative aspect-square overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized /> : null}
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">{item.name}</h3>
                <p className="mt-1 text-xs font-bold text-[var(--brand-dark)]">{formatCurrency(item.basePrice)}</p>
                {item.description ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.description}</p> : null}
                {item.options.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.options.map((option) => (
                      <label key={option.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[0.68rem] font-bold text-[var(--muted)]">
                        <input type="checkbox" className="accent-[var(--brand)]" onChange={() => toggleOption(item.id, option.id)} />
                        {option.name} +{formatCurrency(option.price)}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
              <label className="text-xs font-bold text-[var(--ink)]">
                Qty
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={quantities[item.id] ?? 0}
                  onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))}
                  className="form-control mt-1 w-20 px-3 text-xs"
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="buyerName" placeholder="Your name" className="form-control px-3 text-xs" />
        <input name="buyerPhone" placeholder="Your phone number" className="form-control px-3 text-xs" />
        <input name="deliveryAddress" required placeholder="Delivery address or area" className="form-control px-3 text-xs sm:col-span-2" />
        <textarea name="deliveryNote" rows={3} placeholder="Delivery note, landmark, or preferred time" className="form-control px-3 py-2 text-xs sm:col-span-2" />
        <input name="paymentReference" placeholder="MoMo reference after sending payment" className="form-control px-3 text-xs sm:col-span-2" />
      </div>

      {momoNumber ? (
        <p className="mt-3 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-semibold leading-5 text-[var(--brand-dark)]">
          Seller MoMo number: <strong>{momoNumber}</strong>. The seller will confirm payment received in ShopLinkk.
        </p>
      ) : null}
      {message ? (
        <p className={`mt-3 flex items-start gap-2 rounded-[8px] p-3 text-xs font-semibold ${success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={15} /> : <ShoppingBasket className="mt-0.5 shrink-0" size={15} />}
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-4">
        <ShoppingBasket size={16} />
        {pending ? "Placing order..." : "Place food order"}
      </Button>
    </form>
  );
}
