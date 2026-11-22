import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const authDependencies = vi.hoisted(() => ({
  getSession: vi.fn(),
  configure: vi.fn(),
  options: undefined as {
    socialProviders: { google: { mapProfileToUser: (profile: unknown) => unknown } };
    account: { accountLinking: { requireLocalEmailVerified: boolean } };
  } | undefined,
}));
vi.mock("better-auth", () => ({
  betterAuth: (options: unknown) => {
    authDependencies.configure(options);
    authDependencies.options = options as typeof authDependencies.options;
    return { api: { getSession: authDependencies.getSession } };
  },
}));
vi.mock("@better-auth/mongo-adapter", () => ({ mongodbAdapter: () => ({}) }));
vi.mock("@/lib/db/mongodb", () => ({
  getMongoClient: () => ({ db: () => ({}) }),
}));

import { getSession } from "@/lib/auth/server";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("DATABASE_URL", "mongodb://localhost:27017");
  vi.stubEnv("DATABASE_NAME", "account_test");
  vi.stubEnv("BETTER_AUTH_SECRET", "x".repeat(32));
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.stubEnv("GOOGLE_CLIENT_ID", "test");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test");
});

describe("server session resolution", () => {
  it("validates the incoming cookie with the provider and disables cached session claims", async () => {
    const headers = new Headers({
      cookie: "better-auth.session_token=untrusted",
    });
    authDependencies.getSession.mockResolvedValue(null);
    expect(await getSession(headers)).toBeNull();
    expect(authDependencies.configure).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: {
          google: expect.objectContaining({ disableImplicitSignUp: true }),
        },
      }),
    );
    expect(authDependencies.getSession).toHaveBeenCalledWith({
      headers,
      query: { disableCookieCache: true },
    });
  });
  it("does not fabricate a session when auth is unconfigured", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    expect(await getSession(new Headers())).toBeNull();
    expect(authDependencies.getSession).not.toHaveBeenCalled();
  });
  it("requires a valid, Google-verified email before account resolution", async () => {
    await getSession(new Headers());
    const options = authDependencies.options!;
    const map = options.socialProviders.google.mapProfileToUser;
    expect(map({ email: "user@example.com", email_verified: true })).toEqual({});
    for (const profile of [
      { email: "user@example.com", email_verified: false },
      { email: "user@example.com", email_verified: "true" },
      { email: "invalid-address", email_verified: true },
      { email_verified: true },
    ]) {
      expect(map(profile)).toEqual({ email: "", emailVerified: false });
    }
    expect(options.account.accountLinking.requireLocalEmailVerified).toBe(true);
  });
});
