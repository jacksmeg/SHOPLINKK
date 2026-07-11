import { SearchX, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = SearchX,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--line-strong)] bg-white p-8 text-center sm:p-10">
      <div className="mx-auto grid size-11 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon size={20} />
      </div>
      <h2 className="mt-4 text-lg font-black text-[var(--ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
