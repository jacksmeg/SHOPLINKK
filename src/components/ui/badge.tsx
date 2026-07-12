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
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    gold: "bg-cyan-50 text-cyan-800 ring-cyan-200",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-950 ring-blue-100",
    neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
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
