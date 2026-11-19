import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const authDependencies = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("better-auth", () => ({
  betterAuth: () => ({ api: { getSession: authDependencies.getSession } }),
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
});
