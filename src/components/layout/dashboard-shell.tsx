import type { LucideIcon } from "lucide-react";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";

export function DashboardShell({
  eyebrow,
  title,
  description,
  links,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  links: { href: string; label: string; icon: LucideIcon }[];
  children: React.ReactNode;
}) {
  const navigationLinks = links.map((link) => ({
    href: link.href,
    label: link.label,
    icon: link.icon.displayName || link.icon.name || "Circle",
  }));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-7">
      <aside className="mb-5 border-b border-[var(--line)] pb-3 lg:sticky lg:top-[78px] lg:mb-0 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
        <div className="mb-3 hidden px-3 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand)]">{eyebrow}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Workspace</p>
        </div>
        <DashboardNavigation links={navigationLinks} />
      </aside>
      <section className="page-enter min-w-0">
        <header className="mb-5 flex flex-col gap-2 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand)] lg:hidden">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-black text-[var(--ink)]">{title}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">{description}</p>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
