import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const entry = vi.hoisted(() => ({
  session: vi.fn(),
  social: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({ getSession: entry.session }));
vi.mock("@/lib/auth/config", () => ({
  readAuthEnvironment: () => ({ configured: true }),
}));
vi.mock("@/lib/auth/verification-email", () => ({ getVerificationDelivery: () => "mailpit" }));
vi.mock("@/lib/auth/client", () => ({
  authClient: { signIn: { social: entry.social } },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

import LoginPage from "@/app/(auth)/login/page";
import SignUpPage from "@/app/(auth)/signup/page";
import { startGoogleAuthentication } from "@/lib/auth/google-flow";

beforeEach(() => {
  entry.session.mockResolvedValue(null);
  entry.social.mockResolvedValue({
    data: { url: "https://accounts.google.com/o/oauth2/v2/auth" },
    error: null,
  });
  vi.stubGlobal("window", { location: { assign: entry.navigate } });
});
afterEach(() => vi.unstubAllGlobals());

describe("Google account entry", () => {
  it("starts Google without allowing account creation", async () => {
    await startGoogleAuthentication();
    expect(entry.social).toHaveBeenCalledWith({
      provider: "google",
      requestSignUp: false,
      callbackURL: "/weddings",
      errorCallbackURL: "/login",
      disableRedirect: true,
    });
    expect(entry.navigate).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });

  it.each([
    { error: { message: "provider unavailable" }, data: null },
    { error: null, data: {} },
    { error: null, data: { url: "https://unexpected.example.test/auth" } },
  ])("fails safely when Google navigation cannot start", async (result) => {
    entry.social.mockResolvedValue(result);
    await expect(startGoogleAuthentication()).rejects.toThrow();
    expect(entry.navigate).not.toHaveBeenCalled();
  });

  it("renders the registration form with no social signup action", async () => {
    const html = renderToStaticMarkup(
      await SignUpPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Full name");
    expect(html).toContain("Email address");
    expect(html).toContain("Phone number");
    expect(html).toContain("Country code");
    expect(html).toContain("Already a member?");
    expect(html).not.toContain('href="/signup"');
    expect(html).toContain('aria-label="Show password"');
    expect(html).toMatch(/autocomplete="new-password"/i);
    expect(html).not.toContain("Log in with Google");
  });

  it("renders email and Google actions on the login page", async () => {
    const html = renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Log in with Google");
    expect(html).toContain("Forgot password?");
    expect(html).toContain('aria-label="Show password"');
    expect(html).toMatch(/autocomplete="current-password"/i);
    expect(html).not.toContain("Sign up with Google");
  });

  it("helps an unregistered user recover from the login page", async () => {
    const html = renderToStaticMarkup(await LoginPage({
      searchParams: Promise.resolve({ error: "signup_disabled" }),
    }));
    expect(html).toContain("Use the Google account you registered with, or return to the homepage to sign up.");
  });

  it("shows safe retry guidance without echoing provider error strings", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ error: "private-provider-detail" }),
      }),
    );
    expect(html).toContain("Please try again with Google");
    expect(html).not.toContain("private-provider-detail");
  });

  it("sends an already authenticated visitor to My Weddings", async () => {
    entry.session.mockResolvedValue({ user: { id: "existing-user" } });
    await expect(
      SignUpPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect:/weddings");
  });
});
