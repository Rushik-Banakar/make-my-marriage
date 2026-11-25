"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { startGoogleAuthentication } from "@/lib/auth/google-flow";

export function GoogleSignIn({
  available, partner = false,
}: {
  available: boolean; partner?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    try {
      await startGoogleAuthentication(partner);
    } catch {
      setError("We couldn’t start Google authentication. Please try again shortly.");
      setPending(false);
    }
  }

  return (
    <div className="google-control">
      {!available && (
        <p className="account-notice" role="status">
          Sign-in is temporarily unavailable. You can still explore the sample
          wedding from the homepage.
        </p>
      )}
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="google-button"
        type="button"
        onClick={signIn}
        disabled={!available || pending}
        aria-busy={pending}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.89-1.74 2.98-4.3 2.98-7.37Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.75-5.6-4.1H3.06v2.6A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.4 13.94a6 6 0 0 1 0-3.88v-2.6H3.06a10 10 0 0 0 0 9.08l3.34-2.6Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.46l3.34 2.6A5.99 5.99 0 0 1 12 5.96Z"
          />
        </svg>
        {pending ? "Opening Google…" : "Log in with Google"}
      </button>
    </div>
  );
}

export function SignOutButton({ partner = false }: { partner?: boolean } = {}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed");
      router.replace(partner ? "/login?partner=1" : "/login");
      router.refresh();
    } catch {
      setError("Couldn’t sign out. Please try again.");
      setPending(false);
    }
  }
  return (
    <div className="sign-out-control">
      <button
        className="account-button subtle"
        type="button"
        disabled={pending}
        onClick={signOut}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
