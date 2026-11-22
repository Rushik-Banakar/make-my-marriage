import "server-only";
import { z } from "zod";

export function getVerificationDelivery() {
  if (process.env.AUTH_RESEND_API_KEY?.trim() &&
      z.email().safeParse(process.env.AUTH_VERIFICATION_FROM).success) {
    return "resend";
  }
  if (process.env.NODE_ENV === "development" && process.env.AUTH_USE_MAILPIT === "true") {
    return "mailpit";
  }
  return null;
}

export async function sendAccountVerification({
  user,
  url,
}: {
  user: { email: string };
  url: string;
}) {
  const subject = "Verify your Make My Marriage email";
  const message = `Verify your email by opening this link within one hour:\n\n${url}\n\nIf you didn’t register, you can ignore this message.`;
  await sendAuthEmail(user.email, subject, message);
}

export async function sendAuthEmail(email: string, subject: string, message: string) {
  const delivery = getVerificationDelivery();
  if (!delivery) throw new Error("Verification email delivery is unavailable");

  const mailpit = delivery === "mailpit";
  const response = await fetch(mailpit ? "http://127.0.0.1:8025/api/v1/send" : "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(mailpit ? {} : { Authorization: `Bearer ${process.env.AUTH_RESEND_API_KEY}` }),
    },
    body: JSON.stringify(mailpit ? {
      From: { Email: "verification@example.test", Name: "Make My Marriage" },
      To: [{ Email: email }],
      Subject: subject,
      Text: message,
    } : {
      from: process.env.AUTH_VERIFICATION_FROM,
      to: [email],
      subject,
      text: message,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Verification email delivery failed");
}
