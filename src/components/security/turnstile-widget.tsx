"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  onVerify,
}: {
  siteKey?: string;
  onVerify: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    function renderWidget() {
      if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: onVerify,
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify(""),
      });
    }

    renderWidget();
    const interval = window.setInterval(renderWidget, 250);
    return () => {
      window.clearInterval(interval);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = undefined;
      }
    };
  }, [onVerify, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={containerRef} className="min-h-[65px]" />
      <p className="mt-2 text-[0.68rem] font-semibold leading-5 text-[var(--muted)]">
        Protected by Cloudflare security verification.
      </p>
    </div>
  );
}
