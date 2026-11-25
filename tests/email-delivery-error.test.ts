import { afterEach, expect, it, vi } from "vitest";
import { sendAuthEmail } from "@/lib/auth/verification-email";
import { TestSenderRestriction } from "@/lib/auth/email-delivery-error";

vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it.each([
  { message: "You can only send testing emails to your own email address (owner@example.test).", restricted: true },
  { message: "API key lacks sending permissions.", restricted: false },
])("classifies the provider rejection without exposing the provider message", async ({ message, restricted }) => {
  vi.stubEnv("AUTH_RESEND_API_KEY", "test-key");
  vi.stubEnv("AUTH_VERIFICATION_FROM", "onboarding@resend.dev");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message }, { status: 403 })));
  const failure = await sendAuthEmail("partner@example.test", "Invitation", "Test").catch(error => error);
  expect(failure).toBeInstanceOf(Error);
  expect(failure instanceof TestSenderRestriction).toBe(restricted);
  expect(failure.message).not.toContain(message);
});
