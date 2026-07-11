import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  default: {
    card: "app-panel text-[var(--ink)]",
    label: "text-[var(--muted)]",
    value: "text-[var(--ink)]",
    helper: "text-[var(--muted)]",
    icon: "bg-[var(--brand-soft)] text-[var(--brand)]",
  },
  sea: {
    card: "bg-cyan-600 text-white",
    label: "text-cyan-50",
    value: "text-white",
    helper: "text-cyan-50",
    icon: "bg-white/18 text-white",
  },
  pink: {
    card: "bg-pink-600 text-white",
    label: "text-pink-50",
    value: "text-white",
    helper: "text-pink-50",
    icon: "bg-white/18 text-white",
  },
  yellow: {
    card: "bg-yellow-400 text-slate-950",
    label: "text-slate-800",
    value: "text-slate-950",
    helper: "text-slate-800",
    icon: "bg-white/55 text-slate-950",
  },
  red: {
    card: "bg-red-600 text-white",
    label: "text-red-50",
    value: "text-white",
    helper: "text-red-50",
    icon: "bg-white/18 text-white",
  },
  purple: {
    card: "bg-purple-700 text-white",
    label: "text-purple-50",
    value: "text-white",
    helper: "text-purple-50",
    icon: "bg-white/18 text-white",
  },
  blue: {
    card: "bg-blue-700 text-white",
    label: "text-blue-50",
    value: "text-white",
    helper: "text-blue-50",
    icon: "bg-white/18 text-white",
  },
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
}) {
  const styles = toneStyles[tone];
  return (
    <div className={cn("animated-border app-panel-interactive rounded-[8px] border border-[var(--line)] p-4 shadow-sm", styles.card)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={cn("text-xs", styles.label)}>{label}</p>
          <p className={cn("mt-1 text-lg font-black", styles.value)}>{value}</p>
          {helper ? <p className={cn("mt-1 text-xs", styles.helper)}>{helper}</p> : null}
        </div>
        <div className={cn("grid size-9 place-items-center rounded-[7px]", styles.icon)}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}
