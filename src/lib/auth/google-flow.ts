"use client";

import { authClient } from "@/lib/auth/client";

export async function startGoogleAuthentication() {
  const result = await authClient.signIn.social({
    provider: "google",
    requestSignUp: false,
    callbackURL: "/weddings",
    errorCallbackURL: "/login",
    disableRedirect: true,
  });
  if (result.error || !result.data?.url) {
    throw new Error("Google authentication could not be started");
  }
  const redirect = new URL(result.data.url);
  if (
    redirect.protocol !== "https:" ||
    redirect.host !== "accounts.google.com" ||
    redirect.username ||
    redirect.password
  ) {
    throw new Error("Unexpected Google authorization URL");
  }
  // Navigate explicitly so a successful response always opens Google's account screen.
  window.location.assign(redirect.href);
}
