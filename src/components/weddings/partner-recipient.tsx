"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerInvitationCard } from "./partner-invitation-card";
import { SignOutButton } from "@/components/account/auth-controls";
import type { recipientInvite } from "@/modules/weddings/partner-invites";

const storageKey = "mmm.partnerInvitation";
const continuationKey = "mmm.partnerInvitation.continuation";
const tokenPattern = /^[a-f0-9]{64}$/;

function saveContinuation(token: string) {
  try {
    localStorage.setItem(continuationKey, JSON.stringify({ token, expiresAt: Date.now() + 3600000 }));
  } catch {
    // Session storage still supports continuation in the original tab.
  }
}

function readContinuation() {
  try {
    const entry = JSON.parse(localStorage.getItem(continuationKey) ?? "null");
    if (entry && typeof entry.token === "string" && tokenPattern.test(entry.token) && entry.expiresAt > Date.now()) {
      return entry.token as string;
    }
    localStorage.removeItem(continuationKey);
  } catch {
    // Reopening the original link also restores the invitation.
  }
  return "";
}
async function request(token: string, action: "review" | "accept") {
  const response = await fetch("/api/v1/member-invites/recipient", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Please reopen your invitation.");
  return result.data as Awaited<ReturnType<typeof recipientInvite>>;
}
export function PartnerRecipient({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [details, setDetails] = useState<Awaited<ReturnType<typeof recipientInvite>>>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let current = true;
    async function review() {
      const fragment = window.location.hash.slice(1);
      const token = fragment || sessionStorage.getItem(storageKey) || readContinuation();
      if (!tokenPattern.test(token)) throw new Error("Open the invitation link from your email.");
      sessionStorage.setItem(storageKey, token);
      if (fragment) {
        saveContinuation(token);
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (signedIn) {
        const result = await request(token, "review");
        if (current) setDetails(result);
      }
    }
    review().catch(e => { if (current) setError(e.message); });
    return () => { current = false; };
  }, [signedIn]);
  async function accept() {
    setPending(true); setError("");
    try {
      const token = sessionStorage.getItem(storageKey) || "";
      const result = await request(token, "accept");
      sessionStorage.removeItem(storageKey);
      try {
        if (readContinuation() === token) localStorage.removeItem(continuationKey);
      } catch {
        // An accepted token cannot be used again.
      }
      router.replace("/weddings/" + result.weddingId);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); setPending(false); }
  }
  return <>{details ? <PartnerInvitationCard {...details} actions={<button disabled={pending} className="account-button" onClick={accept}>
      {pending ? "Joining…" : "Accept invitation"}</button>} /> :
    <section className="wedding-setup-card"><h1>Partner invitation</h1>
      {signedIn ? <>{!error && <p>Checking your invitation…</p>}{error && <SignOutButton partner />}</> :
        <><p>Use the email address that received your invitation.</p>
        <Link className="account-button" href="/login?partner=1">Log in</Link>{" · "}
        <Link className="account-text-link" href="/signup?partner=1">Sign up</Link></>}
    </section>}
    {error && <p className="account-error" role="alert">{error}</p>}</>;
}
