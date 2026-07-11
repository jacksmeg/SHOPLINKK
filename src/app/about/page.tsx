import { CheckCircle2, MapPinned, MessageCircle, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">About ShopLinkk</p>
      <h1 className="mt-1 text-xl font-black text-[var(--ink)]">Local commerce, built with trust first</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
        ShopLinkk is a buying and selling platform starting in Dunkwa-on-Offin, Ghana. It is designed for real local trade: sellers list products, admins moderate listings, and buyers contact sellers directly before making any purchase.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {[
          { icon: MapPinned, title: "Dunkwa-on-Offin first", text: "The platform is tuned for local locations, nearby sellers, and town-by-town growth." },
          { icon: MessageCircle, title: "Chat before buying", text: "No checkout or online payment is included yet. Buyers ask questions and inspect products first." },
          { icon: ShieldCheck, title: "Moderation ready", text: "Listings can be approved, rejected, removed, and reported from the admin dashboard." },
          { icon: CheckCircle2, title: "Built to expand", text: "The system can add more towns, payment workflows, verification, and delivery features later." },
        ].map((item) => (
          <div key={item.title} className="app-panel app-panel-interactive p-4 sm:p-5">
            <item.icon className="text-[var(--brand)]" size={19} />
            <h2 className="mt-3 text-sm font-black text-[var(--ink)]">{item.title}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
