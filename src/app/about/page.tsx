import Link from "next/link";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock3,
  LocateFixed,
  MapPinned,
  MessageCircle,
  PackageCheck,
  Search,
  ShoppingBag,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const pillars = [
  {
    icon: MapPinned,
    title: "Built from Dunkwa-on-Offin",
    text: "ShopLinkk starts with Dunkwa-on-Offin and the nearby trading communities buyers already know.",
    tone: "bg-cyan-600",
  },
  {
    icon: ShieldCheck,
    title: "Trust before transaction",
    text: "Listings, stores, adverts, riders, and reports are managed through moderation tools before public trust is earned.",
    tone: "bg-blue-700",
  },
  {
    icon: MessageCircle,
    title: "Chat-first buying",
    text: "Buyers can ask questions, call, chat, inspect, and agree with sellers before completing any deal.",
    tone: "bg-pink-600",
  },
  {
    icon: PackageCheck,
    title: "Designed to grow",
    text: "The system supports products, services, food ordering, riders, adverts, stores, and future payment expansion.",
    tone: "bg-purple-700",
  },
];

const audiences = [
  {
    icon: Users,
    title: "Buyers",
    text: "Find products, food, services, nearby stores, favorite items, chat with sellers, follow stores, and track orders.",
  },
  {
    icon: Store,
    title: "Sellers",
    text: "Create a store, add products or services, manage stock, request adverts, read messages, and grow followers.",
  },
  {
    icon: ChefHat,
    title: "Food sellers",
    text: "Manage menus, add food photos, set add-ons, preparation time, delivery details, and receive food orders.",
  },
  {
    icon: Bike,
    title: "Riders",
    text: "Register, verify documents, receive delivery requests, share live status, and support local delivery.",
  },
];

const trustItems = [
  "Admin approval for products, food menu items, adverts, sellers, and riders.",
  "Safety reminders, reports, blocking, account suspension, and moderation queues.",
  "Phone, email, Google account, Cloudflare verification, and secure account controls.",
  "Direct communication between buyer, seller, restaurant, and rider before completion.",
];

export default function AboutPage() {
  return (
    <div className="page-enter">
      <section className="border-b border-[var(--line)] bg-[#061a3a] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">About ShopLinkk</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-black text-white sm:text-3xl">
              A local marketplace for buying, selling, food, services, and delivery in Dunkwa-on-Offin.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
              ShopLinkk is built for people who want local trade to feel simple, direct, and trusted. It connects buyers, sellers, food businesses, service providers, and riders in one clean platform owned and operated by JACK STUDIOS.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href="/marketplace" className="bg-white text-[#061a3a] hover:bg-cyan-100">
                Browse marketplace
              </ButtonLink>
              <ButtonLink href="/sell-on-shoplinkk" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#061a3a]">
                Sell on ShopLinkk
              </ButtonLink>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[10px] border border-white/20 bg-[#12264a] p-4 shadow-2xl shadow-black/20 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-black text-[#061a3a]">Dunkwa first</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100 ring-1 ring-white/15">Products, food, riders</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[10px] bg-white p-4 text-[#061a3a] shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.12em] text-cyan-700">Marketplace live</p>
                    <h2 className="mt-1 text-lg font-black">Find, chat, inspect</h2>
                  </div>
                  <span className="grid size-10 place-items-center rounded-[8px] bg-[#0057ff] text-white">
                    <Search size={18} />
                  </span>
                </div>
                <div className="mt-4 grid gap-2">
                  {[
                    { title: "Fresh rice meal", meta: "Food seller nearby", tone: "bg-[#e6007e]", icon: ChefHat },
                    { title: "Samsung phone", meta: "Verified local store", tone: "bg-[#0098b6]", icon: ShoppingBag },
                    { title: "Fast rider pickup", meta: "Track delivery status", tone: "bg-[#8f00e8]", icon: Truck },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-[8px] ${item.tone} text-white`}>
                        <item.icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500">{item.meta}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[10px] bg-[#ffc400] p-4 text-slate-950 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.12em]">Food order</span>
                    <Clock3 size={18} />
                  </div>
                  <p className="mt-3 text-2xl font-black">25 mins</p>
                  <p className="mt-1 text-xs font-semibold">Estimated preparation and delivery update.</p>
                </div>
                <div className="rounded-[10px] bg-[#0057ff] p-4 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.12em]">Rider tracking</span>
                    <LocateFixed size={18} />
                  </div>
                  <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <span className="size-3 rounded-full bg-white" />
                    <span className="h-1 rounded-full bg-white/35" />
                    <span className="size-3 rounded-full bg-cyan-200" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-blue-100">Buyer, seller, and rider stay updated.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {["Products", "Food", "Riders"].map((item) => (
                <div key={item} className="rounded-[8px] bg-white/10 px-3 py-3 text-center text-xs font-black text-white ring-1 ring-white/10">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pillars.map((item) => (
            <article key={item.title} className={`${item.tone} uiverse-depth-card rounded-[8px] p-4 text-white shadow-sm`}>
              <span className="grid size-10 place-items-center rounded-[8px] bg-white/20">
                <item.icon size={18} />
              </span>
              <h2 className="mt-4 text-sm font-black text-white">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-white/90">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="app-panel p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--brand)]">Why we exist</p>
          <h2 className="mt-2 text-xl font-black">Local commerce should be easier to trust.</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Many local deals already happen through calls, WhatsApp, shop visits, and recommendations. ShopLinkk brings that behavior into one organized place with product pages, store profiles, chat, reports, rider tracking, advert requests, and admin controls.
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            The platform is not trying to remove the human part of local trade. It helps people discover trusted options faster, speak directly, and make better decisions before exchanging money or goods.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((item) => (
            <article key={item.title} className="app-panel app-panel-interactive p-4">
              <item.icon className="text-[var(--brand)]" size={19} />
              <h3 className="mt-3 text-sm font-black">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="app-panel p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--brand)]" size={20} />
            <h2 className="text-lg font-black">Safety and trust</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {trustItems.map((item) => (
              <div key={item} className="flex gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-xs leading-5 text-[var(--muted)]">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--brand)]" size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="app-panel p-5">
          <div className="flex items-center gap-2">
            <MapPinned className="text-[var(--brand)]" size={20} />
            <h2 className="text-lg font-black">JACK STUDIOS</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            ShopLinkk is managed by JACK STUDIOS in Dunkwa-on-Offin, Central Region Ghana. The goal is to help local businesses, food sellers, riders, service providers, and everyday buyers trade with more confidence.
          </p>
          <div className="mt-4 grid gap-2 rounded-[8px] bg-[#061a3a] p-4 text-xs font-semibold text-blue-100">
            <p>Location: Dunkwa-on-Offin, Central Region Ghana</p>
            <p>Phone: 0549896901</p>
            <p>Email: jacksmeg99@gmail.com</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/contact" className="text-xs font-black text-[var(--brand-dark)]">Contact ShopLinkk</Link>
            <Link href="/terms" className="text-xs font-black text-[var(--brand-dark)]">Read terms</Link>
            <Link href="/safety" className="text-xs font-black text-[var(--brand-dark)]">Safety tips</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
