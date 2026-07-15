"use client";

import Link from "next/link";
import { ExternalLink, Trash2, CheckCheck, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactDate, titleCase } from "@/lib/utils";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationList({ notifications }: { notifications: NotificationListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function markAllRead() {
    startTransition(async () => {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not mark notifications as read.");
        return;
      }
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
      setMessage("Notifications marked as read.");
      router.refresh();
    });
  }

  function deleteNotification(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not delete notification.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Notification deleted.");
      router.refresh();
    });
  }

  function clearAll() {
    startTransition(async () => {
      const response = await fetch("/api/notifications", { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message ?? "Could not clear notifications.");
        return;
      }
      setItems([]);
      setMessage("Notifications cleared.");
      router.refresh();
    });
  }

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--muted)]">
          {items.length ? `${items.length} notification${items.length === 1 ? "" : "s"}` : "No notifications"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={markAllRead} disabled={pending || !items.length}>
            <CheckCheck size={15} />
            Mark all read
          </Button>
          <Button type="button" variant="danger" onClick={clearAll} disabled={pending || !items.length}>
            <BellOff size={15} />
            Clear all
          </Button>
        </div>
      </div>

      {message ? <p className="mt-3 rounded-[8px] bg-[var(--brand-soft)] p-3 text-xs font-bold text-[var(--brand-dark)]">{message}</p> : null}

      <div className="mt-4 grid gap-3">
        {items.map((notification) => (
          <article key={notification.id} className="app-panel p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-[var(--ink)]">{notification.title}</p>
                  {!notification.readAt ? <span className="size-2 rounded-full bg-[var(--flash-red)]" aria-label="Unread" /> : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{notification.body}</p>
                <p className="mt-2 text-[0.68rem] text-[var(--muted)]">{compactDate(notification.createdAt)}</p>
              </div>
              <Badge tone={notification.readAt ? "neutral" : "gold"}>{titleCase(notification.type)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
              {notification.href ? (
                <Link href={notification.href} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[7px] border border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">
                  <ExternalLink size={14} />
                  Open
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => deleteNotification(notification.id)}
                disabled={pending}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[7px] bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-60"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </article>
        ))}
        {!items.length ? (
          <div className="app-panel p-6 text-center">
            <p className="text-sm font-black text-[var(--ink)]">Your notifications are clear.</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">New messages, order updates, approvals, reports, and account alerts will appear here.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
