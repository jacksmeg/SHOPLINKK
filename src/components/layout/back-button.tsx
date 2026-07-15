"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({
  label = "Back",
  className,
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => router.back()}
      aria-label={label || "Go back"}
      className={cn("min-h-9 px-3", compact && "size-10 min-h-10 px-0", className)}
    >
      <ArrowLeft size={14} />
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
