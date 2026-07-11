"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchSuggestBox } from "@/components/marketplace/search/search-suggest-box";

export function HomepageSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/marketplace?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 flex max-w-4xl gap-2 rounded-[8px] border border-[var(--line-strong)] bg-white p-2 shadow-lg">
      <SearchSuggestBox value={q} onChange={setQ} className="min-w-0 flex-1" placeholder="What are you looking for?" />
      <button className="min-h-11 rounded-[7px] bg-[var(--brand)] px-5 text-xs font-bold text-white transition hover:bg-[var(--brand-dark)]">
        <Search size={15} className="inline" /> <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
