import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { readAuthEnvironment } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/server";
import { AccountBrand } from "@/components/account/account-brand";
import { GoogleSignIn } from "@/components/account/auth-controls";
import { CredentialsForm } from "@/components/account/credentials-form";
import { PasswordResetForm } from "@/components/account/password-reset-form";
import { getVerificationDelivery } from "@/lib/auth/verification-email";
import { Icon } from "@/components/marketing/icon";
import "@/components/account/account.css";

export async function AuthPage({
  searchParams,
  mode,
}: {
  searchParams: Promise<{ error?: string | string[]; verified?: string; reset?: string; partner?: string }>;
  mode: "signup" | "login";
}) {
  let available = Boolean(readAuthEnvironment());
  let session = null;
  try {
    session = await getSession(await headers());
  } catch {
    available = false;
  }
  const params = await searchParams;
  const partner = params.partner === "1";
  if (session) redirect(partner ? "/partner-invitation" : "/weddings");
  const signingUp = mode === "signup";
  const resetPassword = !signingUp && params.reset === "1";
  const canSendEmail = available && Boolean(getVerificationDelivery());
  let error = "";
  if (params.verified === "1" && params.error) {
    error = "This verification link is invalid or expired. Try logging in with your password to get a new link.";
  } else if (params.error === "email_not_found") {
    error = "Choose a Google account with a valid, verified email address.";
  } else if (params.error === "signup_disabled" && !signingUp) {
    error = "Use the Google account you registered with, or return to the homepage to sign up.";
  } else if (params.error === "google_email_cannot_be_linked") {
    error = "Use your password to log in. Google can only be linked for Gmail or Google Workspace addresses.";
  } else if (params.error === "account_not_linked") {
    error = "Verify your registration email before using the same address with Google.";
  } else if (params.error) {
    error = "We couldn’t complete Google authentication. Please try again with Google.";
  }
  return (
    <div className="account-app login-page">
      <header className="account-header">
        <AccountBrand />
        <Link href="/" className="account-text-link">
          Back to website
        </Link>
      </header>
      <main className="login-main">
        <section className="login-story" aria-labelledby="login-story-title">
          <span className="account-eyebrow">
            The modern way to plan your wedding
          </span>
          <h1 id="login-story-title">
            Your wedding.
            <br />
            Your people.
            <br />
            <em>One plan.</em>
          </h1>
          <p>
            A shared space for your celebrations, the people helping you, and
            every little detail in between.
          </p>
          <div
            className="login-illustration"
            aria-label="Illustrative wedding planning preview"
          >
            <div className="illustration-heading">
              <span className="couple-monogram">A&M</span>
              <div>
                <h2>Aarav & Meera’s Wedding</h2>
                <small>Illustrative wedding preview</small>
              </div>
            </div>
            <div className="illustration-progress">
              <span>A little closer to the celebration</span>
              <strong>24 / 32 tasks</strong>
              <div>
                <span />
              </div>
            </div>
            <div className="login-ceremonies">
              {["Mehendi", "Haldi", "Wedding", "Reception"].map((name) => (
                <span key={name}>
                  <Icon name="flower" />
                  {name}
                </span>
              ))}
            </div>
            <div className="illustration-note">
              <Icon name="people" />
              <p>
                One shared plan.
                <br />
                <strong>Many helping hands.</strong>
              </p>
            </div>
          </div>
          <p className="story-note">
            <Icon name="shield" />
            The couple share ownership. Family and organizers receive selected
            access.
          </p>
        </section>
        <section className="login-card" aria-labelledby="sign-in-title">
          <span className="login-lock">
            <Icon name="lock" />
          </span>
          <span className="account-eyebrow">Your wedding starts here</span>
          <h2 id="sign-in-title">{resetPassword ? "Reset your password" : signingUp ? "Sign up" : "Log in"}</h2>
          {!signingUp && params.verified === "1" && !error &&
            <p className="account-notice" role="status">You can now log in with your email and password.</p>}
          {error && <p className="account-error" role="alert">{error}</p>}
          {resetPassword
            ? <PasswordResetForm available={canSendEmail} partner={partner} />
            : <CredentialsForm partner={partner} signingUp={signingUp} available={signingUp ? canSendEmail : available} />}
          {!signingUp && !resetPassword && <>
            <p className="account-entry-link"><Link href={partner ? "/login?reset=1&partner=1" : "/login?reset=1"}>Forgot password?</Link></p>
            <GoogleSignIn partner={partner} available={available} />
          </>}
          <Link className="account-text-link" href="/#demo">
            Explore the sample workspace
          </Link>
        </section>
      </main>
      <footer className="account-footer">
        Thoughtfully planned. Beautifully together.
      </footer>
    </div>
  );
}
