import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { readAuthEnvironment } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/server";
import { AccountBrand } from "@/components/account/account-brand";
import { GoogleSignIn } from "@/components/account/auth-controls";
import { Icon } from "@/components/marketing/icon";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: "Sign in — Make My Marriage",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let available = Boolean(readAuthEnvironment());
  let session = null;
  try {
    session = await getSession(await headers());
  } catch {
    available = false;
  }
  if (session) redirect("/weddings");
  const params = await searchParams;
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
          <span className="account-eyebrow">Your wedding workspace</span>
          <h2 id="sign-in-title">
            Welcome to
            <br />
            Make My Marriage
          </h2>
          <p>
            Sign in or create your account to bring your celebrations together.
          </p>
          <GoogleSignIn
            available={available}
            hasError={Boolean(params.error)}
          />
          <div className="login-access-note">
            <Icon name="people" />
            <p>
              Your wedding access is based on your memberships and accepted
              invitations.
            </p>
          </div>
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
