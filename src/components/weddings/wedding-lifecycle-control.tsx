"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function WeddingLifecycleControl({ id, slug, restore = false }: { id: string; slug: string; restore?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || confirmation !== slug) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/v1/weddings/${id}${restore ? "/restore" : ""}`, {
        method: restore ? "POST" : "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationSlug: confirmation }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error?.message ?? "The wedding could not be changed."); return; }
      router.replace(restore ? `/weddings/${id}` : "/weddings/deleted"); router.refresh();
    } catch { setError("The request could not finish. Refresh My Weddings to check its status before trying again."); }
    finally { setPending(false); }
  }
  return <section className="wedding-lifecycle" aria-label={restore ? "Restore wedding" : "Delete wedding"}>
    {!open ? <button type="button" className={`account-button ${restore ? "subtle" : "danger"}`} onClick={() => setOpen(true)}>{restore ? "Restore wedding" : "Delete wedding"}</button>
      : <form className="credentials-form" onSubmit={submit}>
        <h3>{restore ? "Restore this wedding?" : "Delete this wedding?"}</h3>
        <p>{restore ? "Your wedding will return to My Weddings. Its website will stay unpublished." : "This removes the wedding from active workspaces and blocks access. Its records are retained, and you can restore it from Deleted weddings. The website address stays reserved."}</p>
        <label>Type {slug} to confirm<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" disabled={pending} required /></label>
        {error && <p role="alert" className="account-error">{error}</p>}
        <div className="wedding-lifecycle-actions"><button className="account-button subtle" type="button" disabled={pending} onClick={() => { setOpen(false); setConfirmation(""); setError(""); }}>Cancel</button>
          <button className={`account-button ${restore ? "" : "danger"}`} type="submit" disabled={pending || confirmation !== slug}>{pending ? "Saving…" : restore ? "Confirm restore" : "Confirm delete"}</button></div>
      </form>}
  </section>;
}
