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
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6 lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-7">
      <aside className="mb-4 rounded-[10px] border border-[var(--line)] bg-white p-2 shadow-sm lg:sticky lg:top-[78px] lg:mb-0 lg:self-start lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:bg-transparent lg:p-0 lg:pr-5 lg:shadow-none">
        <div className="mb-3 hidden px-3 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand)]">{eyebrow}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Workspace</p>
        </div>
        <div className="mb-2 flex items-center justify-between gap-3 px-1 lg:hidden">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--brand-dark)]">{eyebrow} menu</p>
          <p className="text-[0.68rem] font-semibold text-[var(--muted)]">{links.length} tools</p>
        </div>
        <DashboardNavigation links={navigationLinks} />
      </aside>
      <section className="page-enter min-w-0">
        <header className="mb-5 border-b border-[var(--line)] pb-5">
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
