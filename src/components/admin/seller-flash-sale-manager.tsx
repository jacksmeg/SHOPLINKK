"use client";

import Image from "next/image";
import { Flame, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { compactDate, formatCurrency } from "@/lib/utils";

type FlashSaleProduct = {
  id: string;
  title: string;
  price: number;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  imageUrl: string;
  sellerName: string;
  storeName?: string | null;
  categoryName: string;
};

function datetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultEnd() {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultStart() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function SellerFlashSaleManager({ products }: { products: FlashSaleProduct[] }) {
  const [rows, setRows] = useState(products);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter((row) =>
      [row.title, row.sellerName, row.storeName, row.categoryName]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value)),
    );
  }, [query, rows]);

  const activeCount = rows.filter((row) => {
    if (!row.salePrice || !row.saleStartsAt || !row.saleEndsAt) return false;
    const now = Date.now();
    return new Date(row.saleStartsAt).getTime() <= now && new Date(row.saleEndsAt).getTime() > now;
  }).length;

  return (
    <section className="mb-4 rounded-[8px] border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-[var(--ink)]">
            <Flame size={17} className="text-red-600" />
            Seller flash sales
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Admin can place seller products on flash sale, update sale price and schedule, or remove the sale from the homepage.
          </p>
        </div>
        <div className="rounded-full bg-red-600 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white">
          {activeCount} live
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search seller product, store, or category..."
          className="form-control px-3 text-xs"
        />
        <p className="flex min-h-10 items-center text-xs font-bold text-[var(--muted)]">{filtered.length} products</p>
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.slice(0, 80).map((product) => (
          <FlashSaleProductRow
            key={product.id}
            product={product}
            onUpdate={(next) => setRows((current) => current.map((row) => row.id === next.id ? next : row))}
          />
        ))}
        {!filtered.length ? (
          <p className="rounded-[8px] bg-[var(--surface-muted)] p-4 text-center text-xs font-bold text-[var(--muted)]">
            No seller products found for this search.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FlashSaleProductRow({
  product,
  onUpdate,
}: {
  product: FlashSaleProduct;
  onUpdate: (product: FlashSaleProduct) => void;
}) {
  const router = useRouter();
  const [salePrice, setSalePrice] = useState(product.salePrice ? String(product.salePrice) : "");
  const [saleStartsAt, setSaleStartsAt] = useState(datetimeLocal(product.saleStartsAt) || defaultStart());
  const [saleEndsAt, setSaleEndsAt] = useState(datetimeLocal(product.saleEndsAt) || defaultEnd());
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  const active = Boolean(
    product.salePrice &&
      product.saleStartsAt &&
      product.saleEndsAt &&
      new Date(product.saleStartsAt).getTime() <= Date.now() &&
      new Date(product.saleEndsAt).getTime() > Date.now(),
  );

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function save() {
    setMessage("");
    setIsError(false);
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${product.id}/flash-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePrice, saleStartsAt, saleEndsAt }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setIsError(true);
        setMessage(result?.message ?? "Flash sale could not be saved.");
        return;
      }
      onUpdate({
        ...product,
        salePrice: result.product.salePrice,
        saleStartsAt: result.product.saleStartsAt,
        saleEndsAt: result.product.saleEndsAt,
      });
      setMessage("Flash sale saved.");
      router.refresh();
    });
  }

  function remove() {
    const confirmed = window.confirm("Remove this product from flash sale?");
    if (!confirmed) return;

    setMessage("");
    setIsError(false);
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${product.id}/flash-sale`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setIsError(true);
        setMessage(result?.message ?? "Flash sale could not be removed.");
        return;
      }
      setSalePrice("");
      onUpdate({ ...product, salePrice: null, saleStartsAt: null, saleEndsAt: null });
      setMessage("Flash sale removed.");
      router.refresh();
    });
  }

  return (
    <article className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-[8px] bg-white">
            <Image src={product.imageUrl || "/window.svg"} alt={product.title} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="line-clamp-1 text-xs font-black text-[var(--ink)]">{product.title}</p>
              <span className={`rounded-full px-2 py-0.5 text-[0.64rem] font-black uppercase ${active ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                {active ? "Live sale" : product.salePrice ? "Scheduled" : "No sale"}
              </span>
            </div>
            <p className="mt-1 text-[0.68rem] leading-5 text-[var(--muted)]">
              {product.storeName || product.sellerName} / {product.categoryName}
            </p>
            <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">
              {formatCurrency(product.price)}
              {product.salePrice ? <span className="ml-2 text-red-600">Sale: {formatCurrency(product.salePrice)}</span> : null}
            </p>
            {product.saleEndsAt ? <p className="mt-1 text-[0.68rem] text-[var(--muted)]">Ends {compactDate(product.saleEndsAt)}</p> : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[0.68rem] font-semibold text-[var(--muted)]">
            Sale price
            <input value={salePrice} onChange={(event) => setSalePrice(event.target.value)} type="number" min="1" step="0.01" placeholder="0.00" className="form-control mt-1 w-full px-3 text-xs" />
          </label>
          <label className="text-[0.68rem] font-semibold text-[var(--muted)]">
            Starts
            <input value={saleStartsAt} onChange={(event) => setSaleStartsAt(event.target.value)} type="datetime-local" className="form-control mt-1 w-full px-3 text-xs" />
          </label>
          <label className="text-[0.68rem] font-semibold text-[var(--muted)]">
            Ends
            <input value={saleEndsAt} onChange={(event) => setSaleEndsAt(event.target.value)} type="datetime-local" className="form-control mt-1 w-full px-3 text-xs" />
          </label>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
            <Button type="button" disabled={pending} onClick={save} className="min-h-9 px-3">
              <Save size={14} />
              {pending ? "Saving..." : "Save flash sale"}
            </Button>
            <Button type="button" variant="danger" disabled={pending || !product.salePrice} onClick={remove} className="min-h-9 px-3">
              <Trash2 size={14} />
              Remove sale
            </Button>
            {message ? <span className={`text-xs font-semibold ${isError ? "text-red-700" : "text-cyan-800"}`}>{message}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
