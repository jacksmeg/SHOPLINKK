"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { PublicCategory } from "@/lib/marketplace";

const sample = `title,description,price,category,condition,location,area,imageUrl
Clean iPhone XR,Neatly used phone available for inspection before payment,1850,Phones & Tablets,USED,Dunkwa-on-Offin,Town Centre,https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80`;

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function BulkUploadForm({ categories }: { categories: PublicCategory[] }) {
  const router = useRouter();
  const [csv, setCsv] = useState(sample);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const categoryMap = useMemo(
    () => new Map(categories.flatMap((category) => [[category.name.toLowerCase(), category.id], [category.slug, category.id]])),
    [categories],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const [, ...rows] = lines;
    const items = rows.map((row) => {
      const [title, description, price, category, condition, location, area, imageUrl] = splitCsvLine(row);
      return {
        title,
        description,
        price: Number(price),
        categoryId: categoryMap.get(category.toLowerCase()) ?? category,
        condition: condition || "USED",
        location: location || "Dunkwa-on-Offin",
        area,
        stockStatus: "AVAILABLE",
        listingStatus: "PENDING",
        negotiable: true,
        allowCalls: true,
        allowWhatsapp: true,
        imageUrls: [imageUrl],
      };
    });

    startTransition(async () => {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Bulk upload failed.");
        return;
      }
      setMessage(`${result.created} products uploaded for admin review.`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[8px] border border-[var(--line)] bg-white p-6 shadow-sm">
      <label className="text-sm font-bold text-[var(--ink)]">
        CSV products
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={12}
          className="mt-2 w-full rounded-[8px] border border-[var(--line)] px-3 py-3 font-mono text-xs outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        Columns: title, description, price, category, condition, location, area, imageUrl. Upload up to 50 products at a time.
      </p>
      {message ? <p className="mt-3 rounded-[8px] bg-blue-50 p-3 text-sm font-bold text-[var(--brand-dark)]">{message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-4">
        <Upload size={17} />
        Upload products
      </Button>
    </form>
  );
}
