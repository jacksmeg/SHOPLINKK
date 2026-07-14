import Image from "next/image";
import Link from "next/link";
import { Globe2, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import packageJson from "../../../package.json";

const copyrightYear = 2026;
const appVersion = packageJson.version;

export function Footer() {
  return (
    <footer className="border-t border-[#0b2f66] bg-[#061a3a] pb-16 text-white lg:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-9 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
            ShopLinkk helps people in Dunkwa-on-Offin buy and sell locally by chatting directly with trusted sellers before any purchase.
          </p>
          <div className="mt-5 flex items-center gap-3 text-cyan-200">
            <Globe2 size={19} />
            <MessageCircle size={19} />
            <Image src="/brand/gmail-mark.svg" alt="Gmail" width={22} height={16} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-100">Browse</h3>
          <div className="mt-4 grid gap-3 text-sm text-blue-100">
            <Link href="/marketplace">Products</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/favorites">Favorites</Link>
            <Link href="/stores/offin-digital-hub">Seller stores</Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-100">Company</h3>
          <div className="mt-4 grid gap-3 text-sm text-blue-100">
            <Link href="/about">About ShopLinkk</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/safety">Safety tips</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/license-agreement">License agreement</Link>
            <Link href="/community-rules">Community rules</Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-100">JACK STUDIOS</h3>
          <div className="mt-4 grid gap-3 text-sm text-blue-100">
            <span className="inline-flex gap-2"><MapPin size={17} /> Dunkwa-on-Offin, Central Region Ghana</span>
            <span className="inline-flex gap-2"><Phone size={17} /> 0549896901</span>
            <span className="inline-flex gap-2"><Image src="/brand/gmail-mark.svg" alt="Gmail" width={18} height={14} /> jacksmeg99@gmail.com</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#041226] px-4 py-4 text-center text-xs text-blue-100">
        Copyright {copyrightYear} ShopLinkk. Version {appVersion}.
      </div>
    </footer>
  );
}
