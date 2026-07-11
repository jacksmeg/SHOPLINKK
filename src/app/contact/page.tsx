import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { getPlatformConfig } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const config = await getPlatformConfig();
  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Contact</p><h1 className="mt-1 text-xl font-black text-[var(--ink)]">Talk to ShopLinkk</h1><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Reach the platform team for seller support, safety concerns, partnerships, or town expansion requests.</p><div className="mt-6 grid gap-3 text-xs text-[var(--muted)]"><span className="inline-flex items-center gap-2"><MapPin size={16} /> {config.defaultTown}, Ghana</span><span className="inline-flex items-center gap-2"><Phone size={16} /> {config.supportPhone}</span><span className="inline-flex items-center gap-2"><Mail size={16} /> {config.supportEmail}</span></div></div>
        <ContactForm />
      </div>
    </div>
  );
}
