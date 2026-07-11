import { AlertTriangle, BadgeCheck, Handshake, ShieldCheck } from "lucide-react";

const tips = [
  {
    icon: Handshake,
    title: "Meet safely",
    body: "Use public places around town where possible, go with someone you trust, and avoid late-night meetings.",
  },
  {
    icon: AlertTriangle,
    title: "Do not pay before inspection",
    body: "ShopLinkk has no online payment yet. Inspect the item and confirm ownership before handing over money.",
  },
  {
    icon: BadgeCheck,
    title: "Check phones and electronics",
    body: "For phones, confirm IMEI, battery health, screen condition, locks, receipts, and accessories before buying.",
  },
  {
    icon: ShieldCheck,
    title: "Report abuse",
    body: "Report fake listings, pressure to send money first, harassment, copied photos, and suspicious messages.",
  },
];

export default function SafetyPage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Safety</p>
        <h1 className="mt-2 text-xl font-black text-[var(--ink)]">ShopLinkk safe buying guide</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          ShopLinkk is built for chat-first local commerce in Dunkwa-on-Offin. Buyers and sellers should agree clearly, inspect items, and avoid payment pressure.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tips.map((tip) => (
          <article key={tip.title} className="app-panel app-panel-interactive p-4 sm:p-5">
            <tip.icon className="text-[var(--brand)]" size={19} />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{tip.title}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{tip.body}</p>
          </article>
        ))}
      </div>
      <section className="mt-6 rounded-[8px] bg-[var(--brand-soft)] p-4 text-xs leading-6 text-[var(--brand-dark)] sm:p-5">
        <h2 className="text-sm font-black">Community rules</h2>
        <p className="mt-2">Use real photos, honest prices, respectful chat, and clear pickup or delivery discussion. Do not list stolen goods, fake products, unsafe services, or pressure buyers to pay before inspection.</p>
      </section>
    </div>
  );
}
