"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PasswordField } from "@/components/account/password-field";
import { authClient } from "@/lib/auth/client";
import { emailSchema, resetOtpLength, resetOtpMinutes } from "@/lib/auth/credentials";

export function PasswordResetForm({ available }: { available: boolean }) {
  const [email, setEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(address: string) {
    setError("");
    setVerifiedCode("");
    setPending(true);
    try {
      const result = await authClient.emailOtp.requestPasswordReset({ email: address });
      if (result.error) {
        setError(result.error.status === 429
          ? "Too many requests. Wait a minute before requesting another code."
          : "We couldn’t request a code. Please try again shortly.");
        return;
      }
      setEmail(address);
    } catch {
      setError("We couldn’t request a code. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !available) return;
    const data = new FormData(event.currentTarget);
    if (!email) {
      const address = emailSchema.safeParse(data.get("email"));
      if (!address.success) {
        setError("Enter a valid email address, such as name@example.com.");
        return;
      }
      await requestCode(address.data);
      return;
    }

    if (!verifiedCode) {
      const otp = String(data.get("otp")).trim();
      setError("");
      setPending(true);
      try {
        const result = await authClient.emailOtp.checkVerificationOtp({
          email, otp, type: "forget-password",
        });
        if (result.error || !result.data?.success) {
          setError(result.error?.code === "TOO_MANY_ATTEMPTS" || result.error?.status === 429
            ? "Too many attempts. Wait a minute, then request a new code."
            : "That code is incorrect or expired. Try again or request a new code.");
          return;
        }
        setVerifiedCode(otp);
      } catch {
        setError("We couldn’t verify the code. Please try again.");
      } finally {
        setPending(false);
      }
      return;
    }

    const password = String(data.get("password"));
    if (password !== data.get("confirmation")) {
      setError("The passwords don’t match.");
      return;
    }
    setError("");
    setPending(true);
    try {
      const result = await authClient.emailOtp.resetPassword({
        email, otp: verifiedCode, password,
      });
      if (result.error) {
        if (result.error.code === "INVALID_OTP" || result.error.code === "OTP_EXPIRED" ||
            result.error.code === "TOO_MANY_ATTEMPTS") {
          setVerifiedCode("");
          setError("This code can no longer be used. Request a new code.");
        } else {
          setError(result.error.status === 429
            ? "Too many attempts. Wait a minute before trying again."
            : "We couldn’t reset your password. Please try again.");
        }
        return;
      }
      setCompleted(true);
    } catch {
      setError("We couldn’t reset your password. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  if (completed) {
    return <p className="account-notice" role="status">Your password has been reset. <Link href="/login">Log in</Link> with your new password.</p>;
  }

  return (
    <form className="credentials-form" key={`${email}:${Boolean(verifiedCode)}`} method="post" onSubmit={submit}>
      {!available && <p className="account-notice" role="status">Password reset is unavailable until email delivery is configured.</p>}
      {verifiedCode && <p className="account-notice" role="status">Code verified. Set your new password.</p>}
      {email && !verifiedCode && <p className="account-notice" role="status">
        If this address is registered, check <strong>{email}</strong> and its spam folder for a code. It expires in {resetOtpMinutes} minutes.
      </p>}
      <fieldset disabled={!available || pending}>
        {verifiedCode ? <>
          <PasswordField label="New password" name="password" autoComplete="new-password" />
          <PasswordField label="Confirm new password" name="confirmation" autoComplete="new-password" />
        </> : email ? <label>
          Email code
          <input name="otp" inputMode="numeric" autoComplete="one-time-code"
            pattern={`[0-9]{${resetOtpLength}}`} maxLength={resetOtpLength} required />
        </label> : <label>
          Registered email address
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="account-button" type="submit" aria-busy={pending}>
          {pending ? "Please wait…" : verifiedCode ? "Reset password" : email ? "Verify code" : "Send code"}
        </button>
        {email && <button className="account-button subtle" type="button" onClick={() => requestCode(email)}>Send a new code</button>}
        {email && <button className="account-button subtle" type="button" onClick={() => { setEmail(""); setVerifiedCode(""); setError(""); }}>Use a different email</button>}
      </fieldset>
      <p className="account-entry-link"><Link href="/login">Back to login</Link></p>
    </form>
  );
}
