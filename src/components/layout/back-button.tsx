"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <Button type="button" variant="secondary" onClick={() => router.back()} className="min-h-9 px-3">
      <ArrowLeft size={14} />
      {label}
    </Button>
  );
}
