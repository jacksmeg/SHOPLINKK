"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CategoryActions({
  categoryId,
  name,
}: {
  categoryId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function edit() {
    const nextName = window.prompt("Category name", name);
    if (!nextName) return;

    startTransition(async () => {
      await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete ${name}? Categories with products cannot be deleted.`)) return;

    startTransition(async () => {
      await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={edit} className="min-h-9 px-3 text-xs">
        <Pencil size={14} />
        Edit
      </Button>
      <Button type="button" variant="danger" disabled={pending} onClick={remove} className="min-h-9 px-3 text-xs">
        <Trash2 size={14} />
        Delete
      </Button>
    </div>
  );
}

