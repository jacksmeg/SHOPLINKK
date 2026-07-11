"use client";

import Link from "next/link";
import { Bell, BellRing, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type PushConfig = { enabled?: boolean; publicKey?: string };
type Notice = { id: string; title: string; body: string; href?: string | null; createdAt?: string };

function decodeApplicationKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const decoded = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) output[index] = decoded.charCodeAt(index);
  return output;
}

function browserContext() {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    connection: connection?.effectiveType ?? "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function NotificationHub() {
  const { data: session, status } = useSession();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pushConfig, setPushConfig] = useState<PushConfig | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const [pushPrompt, setPushPrompt] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!pushMessage) return;
    const timer = window.setTimeout(() => setPushMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [pushMessage]);

  useEffect(() => {
    if (status !== "authenticated" || !session.user?.id) return;
    void fetch("/api/security/login-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(browserContext()),
    }).catch(() => null);
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated" || !session.user?.id) return;
    let active = true;
    let since = new Date().toISOString();
    const poll = async () => {
      const response = await fetch(`/api/notifications?since=${encodeURIComponent(since)}`, { cache: "no-store" }).catch(() => null);
      if (!active || !response?.ok) return;
      const notifications = await response.json().catch(() => []) as Notice[];
      const latest = notifications[0];
      if (latest?.createdAt) since = latest.createdAt;
      if (latest && document.visibilityState === "visible") setNotice(latest);
    };
    const timer = window.setInterval(() => void poll(), 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated" || !session.user?.id || !("serviceWorker" in navigator) || !("Notification" in window)) return;
    let active = true;
    fetch("/api/push/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((config: PushConfig) => {
        if (!active) return;
        setPushConfig(config);
        if (!config.enabled || !config.publicKey) return;
        if (Notification.permission === "granted") {
          void subscribe(config.publicKey);
        } else if (Notification.permission === "default") {
          setPushPrompt(true);
        }
      })
      .catch(() => null);
    return () => { active = false; };
  }, [session?.user?.id, status]);

  async function subscribe(publicKey: string) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeApplicationKey(publicKey) });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("The browser returned an incomplete device subscription.");
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }),
      });
      if (!response.ok) throw new Error("ShopLinkk could not save this device.");
      setPushReady(true);
      setPushPrompt(false);
      setPushMessage("");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Device alerts could not be enabled.");
    }
  }

  async function enablePush() {
    if (!pushConfig?.publicKey || !("Notification" in window)) return;
    setPushBusy(true);
    setPushMessage("");
    const permission = await Notification.requestPermission();
    if (permission === "granted") await subscribe(pushConfig.publicKey);
    else setPushMessage("Browser permission was not granted. You can enable it in site settings later.");
    setPushBusy(false);
  }

  if (status !== "authenticated") return null;
  if (!notice && !pushPrompt && !pushMessage) return null;

  return (
    <div className="fixed bottom-[4.8rem] right-3 z-[90] grid w-[min(360px,calc(100vw-1.5rem))] gap-2 lg:bottom-4 lg:right-5">
      {notice ? (
        <div className="notification-toast rounded-[8px] border border-[var(--line)] bg-white p-3 shadow-2xl" role="status">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]"><BellRing size={16} /></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-black text-[var(--ink)]">{notice.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{notice.body}</p>{notice.href ? <Link href={notice.href} onClick={() => setNotice(null)} className="mt-2 inline-flex text-xs font-bold text-[var(--brand-dark)]">Open notification</Link> : null}</div>
            <button type="button" title="Dismiss notification" onClick={() => setNotice(null)} className="grid size-7 shrink-0 place-items-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--surface-muted)]"><X size={14} /></button>
          </div>
        </div>
      ) : null}
      {pushPrompt || pushMessage ? (
        <div className="rounded-[8px] border border-cyan-200 bg-cyan-50 p-3 shadow-xl">
          <div className="flex items-start gap-3">
            {pushMessage ? <ShieldAlert className="mt-0.5 shrink-0 text-cyan-800" size={17} /> : <Bell className="mt-0.5 shrink-0 text-cyan-800" size={17} />}
            <div className="min-w-0 flex-1"><p className="text-xs font-black text-cyan-950">{pushMessage ? "Device alerts need attention" : "Enable device alerts"}</p><p className="mt-1 text-xs leading-5 text-cyan-900">{pushMessage || "Get new chat messages even when ShopLinkk is not open."}</p>{pushPrompt && !pushMessage ? <button type="button" onClick={() => void enablePush()} disabled={pushBusy} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-950">{pushBusy ? "Enabling..." : "Enable alerts"} <CheckCircle2 size={14} /></button> : null}</div>
            <button type="button" title="Dismiss device alert prompt" onClick={() => { setPushPrompt(false); setPushMessage(""); }} className="grid size-7 shrink-0 place-items-center rounded-[6px] text-cyan-900 hover:bg-cyan-100"><X size={14} /></button>
          </div>
        </div>
      ) : null}
      {pushReady ? <span className="sr-only">Device notifications are enabled.</span> : null}
    </div>
  );
}
