"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { PasswordField } from "@/components/account/password-field";
import {
  countryCodeSchema, emailSchema, nationalPhoneSchema,
  phoneSchema,
} from "@/lib/auth/credentials";

export function CredentialsForm({ signingUp, available, partner = false }: {
  partner?: boolean;
  signingUp: boolean;
  available: boolean;
}) {
  const destination = partner ? "/partner-invitation" : "/weddings";
  const login = partner ? "/login?partner=1" : "/login";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [submission, setSubmission] = useState<{ email: string; accountExists: boolean } | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || pending) return;
    const data = new FormData(event.currentTarget);
    const parsedEmail = emailSchema.safeParse(data.get("email"));
    if (!parsedEmail.success) {
      setError("Enter a valid email address, such as name@example.com.");
      return;
    }
    const email = parsedEmail.data;
    const password = String(data.get("password"));
    const callbackURL = partner ? "/login?verified=1&partner=1" : "/login?verified=1";
    setError("");
    setPending(true);
    try {
      if (signingUp) {
        const countryCode = String(data.get("countryCode")).trim();
        const phone = String(data.get("phone")).trim().replace(/[\s()-]/g, "");
        const contactPhone = countryCode + phone;
        if (!countryCodeSchema.safeParse(countryCode).success) {
          setError("Enter a country code such as +91.");
          return;
        }
        if (!nationalPhoneSchema.safeParse(phone).success || !phoneSchema.safeParse(contactPhone).success) {
          setError("Enter your phone number in the second field without the country code.");
          return;
        }
        const result = await authClient.signUp.email({
          name: String(data.get("name")).trim(), email, password, contactPhone, callbackURL,
        });
        if (result.error) {
          if (result.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
            setSubmission({ email, accountExists: true });
            return;
          }
          setError(result.error.code === "INVALID_EMAIL"
            ? "Enter a valid email address, such as name@example.com."
            : result.error.status === 429
            ? "Too many attempts. Please wait and try again."
            : "We couldn’t complete registration. Check your details and try again.");
          return;
        }
        setSubmission({ email, accountExists: false });
        return;
      }
      const result = await authClient.signIn.email({ email, password, callbackURL: destination });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          setError("Verify your email before logging in. Check your inbox and spam folder for the verification link.");
        } else if (result.error.status === 429) {
          setError("Too many attempts. Please wait and try again.");
        } else if (result.error.status === 401) {
          setError("That email and password didn’t match. If you joined with Google, use Log in with Google. You can also choose Forgot password to set a new password.");
        } else {
          setError("We couldn’t log you in. Please try again shortly.");
        }
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setError("The request couldn’t finish. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  if (submission) {
    return <div className="account-notice" role="status">
      {submission.accountExists
        ? <p>An account already exists with this email. <Link href={login}>Please log in</Link>.</p>
        : <p>Check <strong>{submission.email}</strong> for the verification link before logging in.</p>}
      <button className="account-button subtle" type="button" onClick={() => setSubmission(null)}>
        Use a different email
      </button>
    </div>;
  }

  return (
    <form className="credentials-form" method="post" onSubmit={submit}>
      {signingUp && <p>We’ll email you a link to verify your address.</p>}
      {!available && <p className="account-notice" role="status">
        {signingUp ? "Registration is temporarily unavailable." : "Email login is temporarily unavailable."}
      </p>}
      <fieldset disabled={!available || pending}>
        {signingUp && <label>
          Full name
          <input name="name" autoComplete="name" maxLength={100} required />
        </label>}
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        {signingUp && <div className="phone-fields">
          <label>
            Country code
            <input name="countryCode" type="tel" autoComplete="tel-country-code" defaultValue="+91" maxLength={4} required />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel-national" placeholder="98765 43210" maxLength={22} required />
          </label>
        </div>}
        <PasswordField label="Password" name="password"
          autoComplete={signingUp ? "new-password" : "current-password"} />
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="account-button" type="submit" aria-busy={pending}>
          {pending ? "Please wait…" : signingUp ? "Sign up" : "Log in"}
        </button>
      </fieldset>
      {signingUp && <p className="account-entry-link">Already a member? <Link href={login}>Log in</Link></p>}
    </form>
  );
}
