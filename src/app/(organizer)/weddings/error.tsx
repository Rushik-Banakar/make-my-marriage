"use client";

import Link from "next/link";
import "@/components/account/account.css";

export default function WeddingsError({ reset }: { reset: () => void }) {
  return (
    <main className="account-app account-failure">
      <h1>We couldn’t load your weddings.</h1>
      <p>
        Your account or wedding information is temporarily unavailable. Please
        try again.
      </p>
      <button className="account-button" onClick={reset}>
        Try again
      </button>
      <Link className="account-text-link" href="/login">
        Return to sign in
      </Link>
    </main>
  );
}
