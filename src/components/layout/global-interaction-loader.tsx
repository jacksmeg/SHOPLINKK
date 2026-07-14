"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function shouldIgnoreHref(href: string) {
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("sms:") ||
    href.startsWith("whatsapp:")
  );
}

export function GlobalInteractionLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("Loading...");
  const timer = useRef<number | null>(null);

  function stop() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setActive(false);
  }

  function start(nextLabel = "Loading...") {
    setLabel(nextLabel);
    setActive(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), 6000);
  }

  useEffect(() => {
    stop();
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        if (anchor.target || anchor.hasAttribute("download") || shouldIgnoreHref(href)) return;
        const next = new URL(href, window.location.href);
        if (next.origin !== window.location.origin) return;
        if (`${next.pathname}${next.search}` !== `${window.location.pathname}${window.location.search}`) start("Loading page...");
        return;
      }

      const button = target.closest("button") as HTMLButtonElement | null;
      if (button && !button.disabled && button.getAttribute("aria-label") !== "Toggle theme") {
        start(button.type === "submit" ? "Saving..." : "Working...");
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (!event.defaultPrevented) start("Saving...");
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-cyan-100">
        <div className="h-full w-1/2 animate-[shoplinkk-progress_1.05s_ease-in-out_infinite] rounded-r-full bg-[var(--brand)]" />
      </div>
      <div className="fixed bottom-[5.2rem] left-1/2 z-[120] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#061a3a] px-4 py-2 text-xs font-black text-white shadow-2xl lg:bottom-5">
        <span className="size-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />
        {label}
      </div>
    </>
  );
}
