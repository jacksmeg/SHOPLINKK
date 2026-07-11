import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="animated-border app-panel app-panel-interactive p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-lg font-black text-[var(--ink)]">{value}</p>
          {helper ? <p className="mt-1 text-xs text-[var(--muted)]">{helper}</p> : null}
        </div>
        <div className="grid size-9 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}
