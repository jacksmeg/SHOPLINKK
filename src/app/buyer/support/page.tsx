import { AlertTriangle, LifeBuoy, MessageCircle, Shield } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth-guards";
import { buyerLinks } from "@/lib/buyer-navigation";

export const dynamic = "force-dynamic";

export default async function BuyerSupportPage() {
  await requireUser();
  return (
    <DashboardShell eyebrow="Buyer" title="Customer support" description="Get help, read safety tips, report issues, and contact ShopLinkk support." links={buyerLinks}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Live chat" value="Ready" icon={MessageCircle} helper="Use contact page" tone="sea" />
        <StatCard label="Reports" value="Protected" icon={AlertTriangle} helper="Report bad actors" tone="red" />
        <StatCard label="Safety" value="Active" icon={Shield} helper="Inspect before payment" tone="yellow" />
      </div>
      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          { title: "Contact support", body: "Reach ShopLinkk for account, order, or listing issues.", href: "/contact" },
          { title: "Safety tips", body: "Meet safely, inspect items, and report suspicious behavior.", href: "/safety" },
          { title: "Terms and privacy", body: "Read platform rules, privacy, and buyer responsibilities.", href: "/terms" },
        ].map((item) => (
          <div key={item.title} className="app-panel p-4">
            <LifeBuoy size={18} className="text-[var(--brand)]" />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{item.title}</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.body}</p>
            <ButtonLink href={item.href} variant="secondary" className="mt-4">Open</ButtonLink>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
