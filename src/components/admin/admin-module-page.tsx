import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { adminLinks } from "@/lib/admin-navigation";

type Stat = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone?: "default" | "sea" | "pink" | "yellow" | "red" | "purple" | "blue";
};

type Action = {
  title: string;
  body: string;
  href?: string;
};

export function AdminModulePage({
  title,
  description,
  stats,
  actions,
}: {
  title: string;
  description: string;
  stats: Stat[];
  actions: Action[];
}) {
  return (
    <DashboardShell eyebrow="Admin" title={title} description={description} links={adminLinks}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const body = (
            <article className="app-panel app-panel-interactive p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-[var(--ink)]">{action.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{action.body}</p>
                </div>
                <ArrowRight className="mt-0.5 text-[var(--brand)]" size={17} />
              </div>
            </article>
          );
          return action.href ? <Link key={action.title} href={action.href}>{body}</Link> : <div key={action.title}>{body}</div>;
        })}
      </section>
    </DashboardShell>
  );
}
