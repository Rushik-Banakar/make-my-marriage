import { describe, expect, it } from "vitest";
import { readAuthEnvironment } from "@/lib/auth/config";

const configured = {
  DATABASE_URL: "mongodb://localhost:27017",
  DATABASE_NAME: "marriage_test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-secret",
};

describe("auth configuration", () => {
  it("does not enable sign-in with missing secrets", () => {
    expect(readAuthEnvironment({})).toBeNull();
    expect(
      readAuthEnvironment({ ...configured, GOOGLE_CLIENT_SECRET: "" }),
    ).toBeNull();
    expect(
      readAuthEnvironment({ ...configured, BETTER_AUTH_SECRET: "short" }),
    ).toBeNull();
  });
  it("accepts local HTTP or production HTTPS with an explicit origin", () => {
    expect(readAuthEnvironment(configured)).not.toBeNull();
    expect(
      readAuthEnvironment({
        ...configured,
        BETTER_AUTH_URL: "https://wedding.example.test",
      }),
    ).not.toBeNull();
  });
  it.each([
    "not-a-url",
    "http://public.example.test",
    "https://example.test/path",
    "https://example.test?token=secret",
    "https://user:password@example.test",
    "file:///etc/passwd",
  ])("rejects unsafe base URL %s", (url) => {
    expect(
      readAuthEnvironment({ ...configured, BETTER_AUTH_URL: url }),
    ).toBeNull();
  });
});
