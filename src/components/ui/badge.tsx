import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "green",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "gold" | "red" | "blue" | "neutral";
  className?: string;
}) {
  const tones = {
    green: "bg-emerald-600 text-white ring-emerald-700",
    gold: "bg-cyan-700 text-white ring-cyan-800",
    red: "bg-red-600 text-white ring-red-700",
    blue: "bg-[var(--brand)] text-white ring-[var(--brand-dark)]",
    neutral: "bg-slate-700 text-white ring-slate-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em] ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
