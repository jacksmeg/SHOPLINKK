"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCheck, MessageSquareText, Paperclip, Send, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { uploadImage } from "@/components/forms/upload-helper";
import { Button } from "@/components/ui/button";
import { compactDate, cn } from "@/lib/utils";

type ChatAttachment = {
  id?: string;
  url: string;
  type: string;
  name?: string | null;
  size?: number | null;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  senderId: string;
  sender: { id: string; name?: string | null; image?: string | null };
  attachments: ChatAttachment[];
};

type ConversationPayload = {
  conversation: {
    id: string;
    product: { title: string; slug: string; images: { url: string }[] };
    buyer: { id: string; name?: string | null; image?: string | null };
    seller: { id: string; name?: string | null; image?: string | null };
  };
  messages: ChatMessage[];
};

type PusherChannel = {
  bind: (event: string, callback: (data: unknown) => void) => void;
  unbind_all: () => void;
};

type PusherClient = {
  subscribe: (channel: string) => PusherChannel;
  unsubscribe: (channel: string) => void;
  disconnect: () => void;
  connection: { bind: (event: string, callback: () => void) => void };
};

type PusherConstructor = new (key: string, options: {
  cluster: string;
  forceTLS: boolean;
  channelAuthorization: { endpoint: string };
}) => PusherClient;

declare global {
  interface Window {
    Pusher?: PusherConstructor;
  }
}

const buyerQuickPrompts = [
  {
    label: "Is it available?",
    body: "Hello, is this product still available?",
  },
  {
    label: "Last price?",
    body: "Hello, what is the last price for this product?",
  },
  {
    label: "Make an offer",
    body: "Hello, I want to make an offer for this product.",
  },
];

function loadPusherClient() {
  if (window.Pusher) return Promise.resolve(window.Pusher);

  return new Promise<PusherConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-shoplinkk-pusher]');
    const ready = () => window.Pusher ? resolve(window.Pusher) : reject(new Error("Pusher did not load"));

    if (existing) {
      existing.addEventListener("load", ready, { once: true });
      existing.addEventListener("error", () => reject(new Error("Pusher could not load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.pusher.com/8.3.0/pusher.min.js";
    script.async = true;
    script.dataset.shoplinkkPusher = "true";
    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", () => reject(new Error("Pusher could not load")), { once: true });
    document.head.append(script);
  });
}

export function ChatWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [notice, setNotice] = useState("");
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const typingActiveRef = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      cache: "no-store",
    });
    if (response.ok) {
      setData(await response.json());
    }
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    let fallbackStarted = false;
    let events: EventSource | null = null;
    let fallbackTimer: number | null = null;
    let client: PusherClient | null = null;
    let channel: PusherChannel | null = null;
    const channelName = `private-conversation-${conversationId}`;

    function startFallback() {
      if (!active || fallbackStarted) return;
      fallbackStarted = true;
      void load();
      fallbackTimer = window.setInterval(() => void load(), 15000);
      events = new EventSource(`/api/chat/conversations/${conversationId}/stream`);
      events.addEventListener("refresh", (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as { typingNames?: string[] };
        setTypingNames(payload.typingNames ?? []);
        void load();
      });
    }

    async function startRealtime() {
      try {
        const response = await fetch("/api/realtime/config", { cache: "no-store" });
        const config = await response.json().catch(() => null) as { enabled?: boolean; key?: string; cluster?: string } | null;
        if (!response.ok || !config?.enabled || !config.key || !config.cluster) {
          startFallback();
          return;
        }

        const Pusher = await loadPusherClient();
        if (!active) return;
        client = new Pusher(config.key, {
          cluster: config.cluster,
          forceTLS: true,
          channelAuthorization: { endpoint: "/api/realtime/auth" },
        });
        channel = client.subscribe(channelName);
        const refresh = () => void load();
        channel.bind("chat:message", refresh);
        channel.bind("chat:read", refresh);
        channel.bind("chat:typing", (event) => {
          const payload = event as { userId?: string; name?: string; isTyping?: boolean };
          if (payload.userId === currentUserId) return;
          setTypingNames(payload.isTyping && payload.name ? [payload.name] : []);
        });
        channel.bind("pusher:subscription_error", startFallback);
        client.connection.bind("error", startFallback);
        void load();
      } catch {
        startFallback();
      }
    }

    void startRealtime();
    return () => {
      active = false;
      if (fallbackTimer) window.clearInterval(fallbackTimer);
      events?.close();
      channel?.unbind_all();
      client?.unsubscribe(channelName);
      client?.disconnect();
    };
  }, [conversationId, currentUserId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed && !attachments.length) return;

    startTransition(async () => {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed || "Attachment",
          attachments: attachments.map((attachment) => ({
            url: attachment.url,
            type: attachment.type,
            name: attachment.name,
            size: attachment.size,
          })),
        }),
      });

      if (response.ok) {
        setBody("");
        setAttachments([]);
        setNotice("");
        await sendTyping(false);
        await load();
        return;
      }

      const result = await response.json().catch(() => null);
      setNotice(result?.message ?? "Could not send message.");
    });
  }

  async function sendTyping(isTyping: boolean) {
    if (typingActiveRef.current === isTyping) return;
    typingActiveRef.current = isTyping;
    await fetch(`/api/chat/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping }),
    }).catch(() => null);
  }

  function updateBody(value: string) {
    setBody(value);
    void sendTyping(Boolean(value.trim()));

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      void sendTyping(false);
    }, 2500);
  }

  function applyQuickPrompt(value: string) {
    updateBody(value);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function addAttachment(file?: File) {
    if (!file) return;
    if (attachments.length >= 4) {
      setNotice("You can attach up to 4 images.");
      return;
    }

    setNotice("Uploading attachment...");
    try {
      const url = await uploadImage(file, "chat");
      setAttachments((current) => [
        ...current,
        { url, type: file.type, name: file.name, size: file.size },
      ]);
      setNotice("Attachment ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  function reportMessage(message: ChatMessage) {
    startTransition(async () => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          reportedUserId: message.senderId === currentUserId ? undefined : message.senderId,
          reason: "Reported chat message",
          details: message.body,
        }),
      });
      setNotice(response.ok ? "Message reported for admin review." : "Could not report this message.");
    });
  }

  if (!data) {
    return (
      <div className="rounded-[8px] border border-[var(--line)] bg-white p-8 text-xs text-[var(--muted)] shadow-sm">
        Loading conversation...
      </div>
    );
  }

  const isBuyer = data.conversation.buyer.id === currentUserId;

  return (
    <div className="uiverse-depth-card overflow-hidden rounded-[8px] border border-[var(--line)] bg-white shadow-lg">
      <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--brand-dark)] p-3 text-white sm:p-4">
        <div className="relative size-11 overflow-hidden rounded-[7px] bg-white/10 ring-1 ring-white/20">
          {data.conversation.product.images[0]?.url ? (
            <Image src={data.conversation.product.images[0].url} alt={data.conversation.product.title} fill className="object-cover" unoptimized />
          ) : null}
        </div>
        <div className="min-w-0">
          <Link href={`/products/${data.conversation.product.slug}`} className="line-clamp-1 text-sm font-black text-white hover:text-cyan-200">
            {data.conversation.product.title}
          </Link>
          <p className="text-xs text-white/70">Product chat. Share details clearly before meeting.</p>
        </div>
      </header>

      <div className="chat-body h-[55vh] min-h-[360px] overflow-y-auto bg-[#f6f7f9] p-3 sm:p-4">
        <div className="space-y-3">
          {data.messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[86%] rounded-[8px] border px-3 py-2.5 shadow-sm sm:max-w-[78%] sm:px-4", mine ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--line)] bg-white text-[var(--ink)]")}>
                  <p className="text-xs leading-5 sm:text-sm">{message.body}</p>
                  {message.attachments?.length ? (
                    <div className="mt-3 grid gap-2">
                      {message.attachments.map((attachment) => (
                        <Link key={attachment.id ?? attachment.url} href={attachment.url} target="_blank" className="relative block aspect-video overflow-hidden rounded-[8px] bg-black/10">
                          <Image src={attachment.url} alt={attachment.name ?? "Chat attachment"} fill className="object-cover" unoptimized />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <p className={cn("mt-1 text-[11px]", mine ? "text-white/72" : "text-[var(--muted)]")}>
                    {message.sender.name ?? "User"} · {compactDate(message.createdAt)}
                    {mine && message.readAt ? (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <CheckCheck size={12} />
                        Read
                      </span>
                    ) : null}
                  </p>
                  {!mine ? (
                    <button
                      type="button"
                      onClick={() => reportMessage(message)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-600"
                    >
                      <ShieldAlert size={12} />
                      Report
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {typingNames.length ? (
            <div className="text-xs font-bold text-[var(--muted)]">
              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={send} className="border-t border-[var(--line)] bg-white p-3">
        {attachments.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <span key={attachment.url} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold text-white">
                {attachment.name ?? "Image"}
                <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.url !== attachment.url))} aria-label="Remove attachment">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {isBuyer ? (
          <div className="quick-chat-panel mb-3 rounded-[8px] border border-[var(--line)] bg-white p-2.5">
            <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--brand-dark)]">
              <MessageSquareText size={14} />
              Quick buyer messages
            </div>
            <div className="flex flex-wrap gap-2">
              {buyerQuickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => applyQuickPrompt(prompt.body)}
                  className="quick-chat-chip rounded-full border border-[var(--line-strong)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-black text-[var(--brand-dark)] transition"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {notice ? <p className="mb-2 rounded-[7px] bg-[var(--brand-dark)] px-3 py-2 text-xs font-semibold text-white">{notice}</p> : null}
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface-muted)] p-2">
          <label className="grid min-h-10 cursor-pointer place-items-center rounded-[7px] border border-[var(--line)] bg-white px-3 text-[var(--brand-dark)] transition hover:border-[var(--brand)]">
            <Paperclip size={17} />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => addAttachment(event.target.files?.[0])} />
          </label>
          <input
            ref={inputRef}
            value={body}
            onChange={(event) => updateBody(event.target.value)}
            placeholder="Type your message..."
            className="min-h-10 min-w-0 rounded-[7px] border border-transparent bg-white px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)]"
          />
          <Button type="submit" disabled={pending} className="min-h-10">
            <Send size={17} />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
