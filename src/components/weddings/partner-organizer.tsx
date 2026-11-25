"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { partnerPanel } from "@/modules/weddings/partner-invites";

type Props = { weddingId: string; ownEmail: string; bride: string; groom: string; panel: Awaited<ReturnType<typeof partnerPanel>> };
export function PartnerOrganizer({ weddingId, ownEmail, bride, groom, panel }: Props) {
  const router = useRouter();
  const invite = panel.invitation;
  const [email, setEmail] = useState(invite?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change(cancel = false) {
    const address = invite && !invite.failed ? invite.email : email.trim();
    if (!cancel && address.toLowerCase() === ownEmail.toLowerCase()) {
      setError("Please enter your partner’s email address."); return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/weddings/" + weddingId + "/member-invites", {
        method: cancel ? "DELETE" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cancel ? { inviteId: invite?.id } : { role: "admin", email: address, replaceId: invite?.id }),
      });
      const result = await response.json();
      if (!response.ok) setError(result.error?.message || "Please try again.");
      else if (cancel) setEmail("");
      router.refresh();
    } catch { setError("We couldn’t reach the server. Refresh to check the invitation status."); }
    finally { setBusy(false); }
  }
  if (panel.joined) return <section className="wedding-setup-card"><h2>Partner joined</h2>
    <dl className="wedding-details">{[bride, groom].map((name, index) => <div key={index}><dt>Co-owner · Admin</dt><dd>{name}</dd></div>)}</dl>
    <Link className="account-text-link" href={"/weddings/" + weddingId}>Back to wedding</Link></section>;
  return <section className="wedding-setup-card">
    <h2>{invite ? invite.failed ? "Delivery failed" : "Invitation pending" : "Send partner invitation"}</h2>
    {invite && !invite.failed ? <><strong>{invite.email}</strong>
      <p>Sent {new Date(invite.sent).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" })}. The invitation is valid for seven days.</p></>
      : <form className="credentials-form" onSubmit={event => { event.preventDefault(); void change(); }}>
        {invite?.failed && !error && <p role="status">{invite.failureMessage}</p>}
        <label>Partner’s email<input type="email" autoComplete="email" maxLength={254} value={email} required onChange={e => setEmail(e.target.value)} /></label>
        <div className="partner-actions"><button className="account-button" disabled={busy}>{invite?.failed ? "Try again" : "Send invitation"}</button></div></form>}
    {invite && <div className="partner-actions">{!invite.failed && <button className="account-button" disabled={busy} onClick={() => change()}>Resend invitation</button>}
      <button className="account-button subtle" disabled={busy} onClick={() => change(true)}>Cancel invitation</button></div>}
    {error && <p className="account-error" role="alert">{error}</p>}
  </section>;
}
