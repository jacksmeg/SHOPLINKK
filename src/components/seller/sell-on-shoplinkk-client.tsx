"use client";

import { AlertCircle, ArrowRight, BadgeCheck, Building2, CheckCircle2, Globe2, Mail, MapPin, PackagePlus, ShieldCheck, Store, Truck, Users, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

const steps = [
  "Create or use your ShopLinkk account",
  "Verify your phone or email",
  "Set up your store profile",
  "Post products, services, food, or adverts",
];

const benefits = [
  { icon: Users, title: "Reach local buyers", body: "Start with Dunkwa-on-Offin and grow into nearby towns." },
  { icon: PackagePlus, title: "List anything legal", body: "Products, services, food menus, events, jobs, vehicles and property." },
  { icon: Truck, title: "Delivery ready", body: "Use riders and order tracking when your store needs delivery." },
  { icon: ShieldCheck, title: "Trust tools", body: "Verification, reviews, reports and admin approval keep the marketplace safer." },
];

function StorefrontIllustration() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[8px] bg-white p-6 shadow-sm lg:min-h-[560px]">
      <div className="absolute inset-x-0 bottom-16 mx-auto h-2 w-[82%] rounded-full bg-slate-900/30" />
      <div className="absolute left-[10%] top-[18%] h-[52%] w-[32%] rounded-t-[18px] bg-[#FACC15] shadow-lg">
        <div className="grid h-20 grid-cols-4 overflow-hidden rounded-t-[18px]">
          {["#0891B2", "#DCE7F8", "#0891B2", "#DCE7F8"].map((color, index) => (
            <div key={index} style={{ background: color }} className="rounded-b-[22px]" />
          ))}
        </div>
        <div className="mx-auto mt-5 h-[54%] w-[58%] rounded-[8px] bg-[#DCE7F8] ring-8 ring-[#0B2F66]/25" />
      </div>
      <div className="absolute right-[9%] top-[18%] h-[52%] w-[36%] rounded-t-[18px] bg-[#E6007E] shadow-lg">
        <div className="grid h-20 grid-cols-5 overflow-hidden rounded-t-[18px]">
          {["#0891B2", "#DCE7F8", "#0891B2", "#DCE7F8", "#0891B2"].map((color, index) => (
            <div key={index} style={{ background: color }} className="rounded-b-[22px]" />
          ))}
        </div>
        <div className="mx-auto mt-7 grid h-[42%] w-[68%] place-items-center rounded-[8px] bg-white/90">
          <Store className="text-[#061A3A]" size={58} strokeWidth={1.7} />
        </div>
      </div>
      <div className="absolute bottom-[17%] left-[43%] h-[250px] w-[96px]">
        <div className="mx-auto size-14 rounded-full bg-[#F59E0B]" />
        <div className="mx-auto mt-2 h-28 w-20 rounded-t-[28px] bg-[#0B2F66]" />
        <div className="mx-auto -mt-2 h-28 w-16 rounded-b-[18px] bg-[#0891B2]" />
        <div className="absolute left-0 top-[78px] h-24 w-5 rotate-[23deg] rounded-full bg-[#F59E0B]" />
        <div className="absolute right-0 top-[78px] h-24 w-5 -rotate-[23deg] rounded-full bg-[#F59E0B]" />
      </div>
      <div className="absolute bottom-[10%] left-[8%] h-24 w-24 rounded-[8px] bg-[#0891B2]/20 p-3">
        <div className="mx-auto h-16 w-3 rounded-full bg-[#0B2F66]" />
        <div className="absolute left-7 top-5 size-5 rounded-full bg-[#0891B2]" />
        <div className="absolute right-7 top-9 size-4 rounded-full bg-[#E6007E]" />
        <div className="absolute left-12 top-11 size-4 rounded-full bg-[#FACC15]" />
      </div>
      <div className="absolute bottom-[10%] right-[8%] h-24 w-24 rounded-[8px] bg-[#0891B2]/20 p-3">
        <div className="mx-auto h-16 w-3 rounded-full bg-[#0B2F66]" />
        <div className="absolute left-8 top-5 size-5 rounded-full bg-[#0891B2]" />
        <div className="absolute right-6 top-8 size-4 rounded-full bg-[#E6007E]" />
        <div className="absolute left-12 top-12 size-4 rounded-full bg-[#FACC15]" />
      </div>
      <div className="absolute bottom-7 left-[10%] flex w-[80%] items-center justify-between">
        {steps.map((_, index) => (
          <span key={index} className="size-5 rounded-full bg-[#F59E0B] ring-8 ring-[#F59E0B]/15" />
        ))}
      </div>
    </div>
  );
}

export function SellOnShoplinkkClient() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [showInstructions, setShowInstructions] = useState(true);
  const [market, setMarket] = useState("dunkwa");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function startSelling() {
    setMessage("");

    if (status === "loading") return;
    if (!session?.user?.id) {
      router.push("/register?role=seller");
      return;
    }
    if (session.user.role === "SELLER") {
      router.push("/seller");
      return;
    }
    if (session.user.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/become-seller", { method: "POST" });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage(result?.message ?? "We could not open your seller account yet.");
          return;
        }

        await update();
        router.push("/seller");
        router.refresh();
      } catch {
        setMessage("We could not reach ShopLinkk. Please check your connection and try again.");
      }
    });
  }

  return (
    <>
      {showInstructions ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-[8px] bg-white p-6 shadow-2xl sm:p-9">
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-muted)]"
              aria-label="Close instructions"
            >
              <X size={17} />
            </button>
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#0B2F66] text-white">
              <Store size={24} />
            </div>
            <h2 className="mt-5 text-center text-xl font-black text-[var(--ink)]">Instructions to sell on ShopLinkk</h2>
            <p className="mt-4 text-center text-sm leading-6 text-[var(--muted)]">
              Please read these before opening your seller account.
            </p>
            <div className="mt-6 grid gap-4 text-sm leading-6 text-[var(--muted)]">
              <p><strong className="text-[var(--ink)]">1.</strong> A real email address and Ghana phone number are required for verification.</p>
              <p><strong className="text-[var(--ink)]">2.</strong> Your store can sell products, services, food, adverts, or delivery-related offers after admin approval.</p>
              <p><strong className="text-[var(--ink)]">3.</strong> ShopLinkk starts with Dunkwa-on-Offin, so choose the nearest market area when setting up your store.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="mx-auto mt-8 flex min-h-12 w-full max-w-xs items-center justify-center rounded-[7px] bg-[#F59E0B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-px hover:bg-[#D97706]"
            >
              Proceed
            </button>
          </div>
        </div>
      ) : null}

      <section className="bg-[#F7F8FA] py-8 sm:py-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.8fr)] lg:px-8">
          <StorefrontIllustration />

          <div className="flex items-center">
            <div className="w-full">
              <div className="mb-7 text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#FACC15] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#061A3A]">
                  <MapPin size={13} /> Dunkwa-on-Offin first
                </p>
                <h1 className="mt-4 text-2xl font-black text-[var(--ink)] sm:text-3xl">Sell on ShopLinkk</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Choose your selling market, then create your seller account or upgrade your existing buyer account.
                </p>
              </div>

              <div className="rounded-[8px] bg-white p-5 shadow-sm sm:p-7">
                <label className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">
                  Select your selling market
                  <select
                    value={market}
                    onChange={(event) => setMarket(event.target.value)}
                    className="mt-3 h-14 w-full rounded-[7px] border border-[var(--line-strong)] bg-white px-4 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="dunkwa">Ghana - Dunkwa-on-Offin</option>
                    <option value="nearby">Nearby towns - coming soon</option>
                    <option value="ghana">Sell across Ghana - coming soon</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={startSelling}
                  disabled={pending || status === "loading" || market !== "dunkwa"}
                  className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-[7px] bg-[#F59E0B] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-px hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {pending ? "Opening seller setup..." : "Start selling on ShopLinkk"}
                  <ArrowRight size={17} />
                </button>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  New sellers register with email or Google. Existing buyers can become sellers using the same account after verification.
                </p>
                {market !== "dunkwa" ? (
                  <p className="mt-3 flex items-start gap-2 rounded-[8px] bg-[#061A3A] p-3 text-xs font-semibold text-white">
                    <Globe2 className="mt-0.5 shrink-0" size={15} />
                    This expansion market is not open yet. Start with Dunkwa-on-Offin for now.
                  </p>
                ) : null}
                {message ? (
                  <p className="mt-4 flex items-start gap-2 rounded-[8px] bg-red-600 p-3 text-xs font-semibold text-white">
                    <AlertCircle className="mt-0.5 shrink-0" size={15} />
                    {message}
                  </p>
                ) : null}
              </div>

              <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span className="h-px flex-1 bg-[var(--line)]" />
                or
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <ButtonLink href="/login?callbackUrl=/seller" variant="secondary" className="w-full">
                Already have a seller account? Sign in
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-[8px] border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#0B2F66] hover:shadow-lg">
                <div className="grid size-11 place-items-center rounded-[7px] bg-[#0B2F66] text-white">
                  <benefit.icon size={19} />
                </div>
                <h3 className="mt-4 text-sm font-black text-[var(--ink)]">{benefit.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{benefit.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-[8px] bg-[#061A3A] p-5 text-white sm:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FACC15] text-xs font-black text-[#061A3A]">{index + 1}</span>
                <p className="text-xs font-bold leading-5 text-white/88">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Mail, title: "Real contact details", body: "Email and phone verification help customers trust your store." },
              { icon: Building2, title: "Store management", body: "Edit your logo, banner, hours, delivery coverage, products, food, and adverts." },
              { icon: BadgeCheck, title: "Admin approval", body: "Listings and food menus go through moderation before going public." },
            ].map((item) => (
              <div key={item.title} className="rounded-[8px] border border-[var(--line)] p-4">
                <item.icon className="text-[#E6007E]" size={18} />
                <p className="mt-3 text-xs font-black text-[var(--ink)]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
