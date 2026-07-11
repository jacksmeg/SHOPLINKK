"use client";

import { CheckCircle2, CircleAlert, ExternalLink, LoaderCircle, PlugZap, Save } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import type { IntegrationDefinition, IntegrationProviderKey } from "@/lib/integration-definitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Summary = {
  provider: IntegrationProviderKey;
  enabled: boolean;
  configured: boolean;
  status: string;
  values: Record<string, string>;
  source: string;
  lastTestedAt: string | null;
  lastTestMessage: string | null;
};

export function IntegrationForm({ definition, summary }: { definition: IntegrationDefinition; summary: Summary }) {
  const [enabled, setEnabled] = useState(summary.enabled);
  const [configured, setConfigured] = useState(summary.configured);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(summary.status);
  const [pending, startTransition] = useTransition();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = Object.fromEntries(definition.fields.map((field) => [field.key, String(data.get(field.key) ?? "")]));

    startTransition(async () => {
      setMessage("");
      const response = await fetch(`/api/admin/integrations/${definition.provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, values }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Settings saved securely." : result?.message ?? "Settings could not be saved.");
      if (response.ok) { setStatus(result.status ?? "CONFIGURED"); setConfigured(result.status !== "NOT_CONFIGURED"); }
    });
  }

  function testConnection() {
    startTransition(async () => {
      setMessage("Testing connection...");
      const response = await fetch(`/api/admin/integrations/${definition.provider}`, { method: "POST" });
      const result = await response.json().catch(() => null);
      setStatus(response.ok ? "CONNECTED" : "ERROR");
      setMessage(result?.message ?? (response.ok ? "Connection successful." : "Connection failed."));
    });
  }

  const connected = status === "CONNECTED";
  const error = status === "ERROR";

  return (
    <form method="post" onSubmit={save} className="app-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[7px] bg-[var(--brand-soft)] text-[var(--brand)]"><PlugZap size={17} /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[var(--ink)]">{definition.name}</h2>
              <Badge tone={connected ? "green" : error ? "red" : summary.configured ? "blue" : "neutral"}>
                {connected ? "Connected" : error ? "Needs attention" : summary.configured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{definition.category} · {summary.source === "environment" ? "Environment settings" : summary.source === "admin" ? "Admin settings" : "No settings"}</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-[var(--brand)]" />
          Enabled
        </label>
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{definition.description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {definition.fields.map((field) => (
          <label key={field.key} className="text-xs font-semibold text-[var(--ink)]">
            {field.label}
            <input
              name={field.key}
              type={field.secret ? "password" : "text"}
              defaultValue={summary.values[field.key] ?? ""}
              placeholder={field.placeholder}
              autoComplete="off"
              className="form-control mt-1.5 w-full px-3 text-xs"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <Button type="submit" disabled={pending}><Save size={15} /> Save</Button>
        <Button type="button" variant="secondary" disabled={pending || !configured} onClick={testConnection}>
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <PlugZap size={15} />}
          Test connection
        </Button>
        <a href={definition.docsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-semibold text-[var(--brand-dark)]">
          Provider setup <ExternalLink size={13} />
        </a>
      </div>
      {message ? (
        <p className={`mt-3 flex items-center gap-2 text-xs font-semibold ${status === "ERROR" ? "text-red-700" : "text-[var(--brand-dark)]"}`}>
          {status === "ERROR" ? <CircleAlert size={15} /> : <CheckCircle2 size={15} />}{message}
        </p>
      ) : summary.lastTestMessage ? <p className="mt-3 text-xs text-[var(--muted)]">Last check: {summary.lastTestMessage}</p> : null}
    </form>
  );
}
