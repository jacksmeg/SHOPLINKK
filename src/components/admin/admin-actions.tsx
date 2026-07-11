"use client";

import { Check, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ProductModerationActions({ productId, featured = false }: { productId: string; featured?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"approve" | "reject" | "delete" | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function run(action: "approve" | "reject" | "delete" | "feature") {
    startTransition(async () => {
      let response: Response;
      if (action === "reject") response = await fetch(`/api/products/${productId}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: note || "Listing needs changes before approval." }) });
      else if (action === "approve") response = await fetch(`/api/products/${productId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: note || "Approved for marketplace visibility." }) });
      else if (action === "feature") response = await fetch(`/api/admin/products/${productId}/feature`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !featured }) });
      else response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "Action completed." : result?.message ?? "Action failed.");
      if (response.ok) { setMode(null); setNote(""); router.refresh(); }
    });
  }

  if (mode) {
    return (
      <div className="grid min-w-[240px] gap-2">
        {mode !== "delete" ? <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder={mode === "approve" ? "Approval note" : "Reason for rejection"} className="form-control w-full resize-none px-2.5 py-2 text-xs" /> : <p className="text-xs leading-5 text-red-700">Remove this listing from the marketplace?</p>}
        <div className="flex gap-2"><Button type="button" variant={mode === "delete" ? "danger" : "primary"} disabled={pending} onClick={() => run(mode)}><Check size={13} /> Confirm</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => setMode(null)}>Cancel</Button></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" disabled={pending} onClick={() => setMode("approve")} className="min-h-8 px-2.5"><Check size={13} /> Approve</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => setMode("reject")} className="min-h-8 px-2.5"><X size={13} /> Reject</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run("feature")} className="min-h-8 px-2.5"><Sparkles size={13} /> {featured ? "Unfeature" : "Feature"}</Button>
        <Button type="button" variant="danger" disabled={pending} onClick={() => setMode("delete")} className="min-h-8 px-2.5" aria-label="Remove listing"><Trash2 size={13} /></Button>
      </div>
      {message ? <p className="mt-2 text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

export function UserBlockAction({ userId, blocked }: { userId: string; blocked: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}/block`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !blocked, reason: blocked ? "" : reason || "Admin moderation" }) });
      if (response.ok) { setEditing(false); setReason(""); router.refresh(); }
    });
  }

  if (!blocked && editing) return <div className="grid min-w-[210px] gap-2"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Suspension reason" className="form-control px-2.5 text-xs" /><div className="flex gap-2"><Button type="button" variant="danger" disabled={pending} onClick={toggle}>Confirm block</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></div>;
  return <Button type="button" variant={blocked ? "secondary" : "danger"} disabled={pending} onClick={() => blocked ? toggle() : setEditing(true)}>{blocked ? "Unblock" : "Block"}</Button>;
}

export function ReportResolveAction({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [pending, startTransition] = useTransition();

  function resolve() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolutionNote: resolutionNote || "Reviewed and resolved by ShopLinkk moderation." }) });
      if (response.ok) router.refresh();
    });
  }

  if (editing) return <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Resolution note" className="form-control min-w-0 px-3 text-xs" /><Button type="button" disabled={pending} onClick={resolve}>Resolve</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>;
  return <Button type="button" disabled={pending} onClick={() => setEditing(true)}>Resolve report</Button>;
}

export function SellerVerifyAction({ sellerId, verified }: { sellerId: string; verified: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/sellers/${sellerId}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: !verified, notes: notes || (verified ? "Verification removed." : "Seller documents reviewed and verified.") }) });
      if (response.ok) { setEditing(false); router.refresh(); }
    });
  }

  if (editing) return <div className="grid min-w-[210px] gap-2"><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Verification note" className="form-control px-2.5 text-xs" /><div className="flex gap-2"><Button type="button" disabled={pending} onClick={toggle}><ShieldCheck size={13} /> Confirm</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></div>;
  return <Button type="button" variant={verified ? "secondary" : "primary"} disabled={pending} onClick={() => setEditing(true)}>{verified ? "Unverify" : "Verify"}</Button>;
}
