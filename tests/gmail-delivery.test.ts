import { afterEach, expect, it, vi } from "vitest";
import { getVerificationDelivery, sendAuthEmail } from "@/lib/auth/verification-email";

const smtp = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ createTransport: () => smtp }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("uses the configured Gmail sender for a different recipient even with Resend configured", async () => {
  vi.stubEnv("AUTH_RESEND_API_KEY", "test");
  vi.stubEnv("AUTH_VERIFICATION_FROM", "onboarding@resend.dev");
  vi.stubEnv("AUTH_GMAIL_USER", "sender@gmail.com");
  vi.stubEnv("AUTH_GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
  await sendAuthEmail("partner@gmail.com", "Invitation", "Test message");
  expect(smtp.sendMail).toHaveBeenCalledWith({
    from: { name: "Make My Marriage", address: "sender@gmail.com" },
    to: "partner@gmail.com", subject: "Invitation", text: "Test message",
  });
});

it("flags incomplete Gmail credentials before starting delivery", () => {
  vi.stubEnv("AUTH_GMAIL_USER", "sender@gmail.com");
  vi.stubEnv("AUTH_GMAIL_APP_PASSWORD", "");
  expect(getVerificationDelivery()).toBeNull();
});
