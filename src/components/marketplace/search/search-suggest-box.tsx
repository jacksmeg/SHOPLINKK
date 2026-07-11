"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid2X2, Search, Store } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestions = {
  products: { id: string; title: string; href: string; image?: string; meta: string }[];
  categories: { id: string; name: string; href: string; count: number }[];
  stores: { id: string; name: string; href: string; image?: string | null; meta: string }[];
};

const emptySuggestions: Suggestions = { products: [], categories: [], stores: [] };

export function SearchSuggestBox({
  value,
  onChange,
  placeholder = "Search products, services, stores...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>(emptySuggestions);
  const boxRef = useRef<HTMLDivElement>(null);
  const hasResults = useMemo(
    () => suggestions.products.length || suggestions.categories.length || suggestions.stores.length,
    [suggestions],
  );

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions(emptySuggestions);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await response.json().catch(() => emptySuggestions);
        setSuggestions(data);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setSuggestions(emptySuggestions);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function submit(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    setOpen(false);
    router.push(`/marketplace?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div ref={boxRef} className={`relative block ${className}`}>
      <span className="sr-only">Search ShopLinkk</span>
      <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" size={16} />
      <input
        aria-label="Search ShopLinkk"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(Boolean(value.trim().length >= 2))}
        onKeyDown={submit}
        placeholder={placeholder}
        className="form-control w-full pl-9 pr-3 text-sm"
      />
      {open && value.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-2xl">
          {loading ? <p className="p-3 text-xs font-semibold text-[var(--muted)]">Searching...</p> : null}
          {!loading && !hasResults ? <p className="p-3 text-xs font-semibold text-[var(--muted)]">No related options yet.</p> : null}
          {suggestions.products.length ? (
            <div className="border-b border-[var(--line)] p-2">
              <p className="px-2 pb-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Listings</p>
              {suggestions.products.map((item) => (
                <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[7px] p-2 text-xs hover:bg-[var(--surface-muted)]">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-[7px] bg-[var(--surface-muted)]">
                    {item.image ? <Image src={item.image} alt="" fill className="object-cover" unoptimized /> : <Search className="m-2.5 text-[var(--muted)]" size={18} />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-black text-[var(--ink)]">{item.title}</span>
                    <span className="text-[0.68rem] text-[var(--muted)]">{item.meta}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          {suggestions.categories.length ? (
            <div className="border-b border-[var(--line)] p-2">
              <p className="px-2 pb-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Categories</p>
              {suggestions.categories.map((item) => (
                <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[7px] p-2 text-xs hover:bg-[var(--surface-muted)]">
                  <span className="grid size-9 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]"><Grid2X2 size={16} /></span>
                  <span className="font-bold text-[var(--ink)]">{item.name}</span>
                  <span className="ml-auto text-[0.68rem] font-semibold text-[var(--muted)]">{item.count} listings</span>
                </Link>
              ))}
            </div>
          ) : null}
          {suggestions.stores.length ? (
            <div className="p-2">
              <p className="px-2 pb-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[var(--muted)]">Stores</p>
              {suggestions.stores.map((item) => (
                <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[7px] p-2 text-xs hover:bg-[var(--surface-muted)]">
                  <span className="relative grid size-9 place-items-center overflow-hidden rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]">
                    {item.image ? <Image src={item.image} alt="" fill className="object-cover" unoptimized /> : <Store size={16} />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-bold text-[var(--ink)]">{item.name}</span>
                    <span className="text-[0.68rem] text-[var(--muted)]">{item.meta}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
