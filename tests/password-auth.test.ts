import { afterEach, expect, it, vi } from "vitest";
import { getAuth } from "@/lib/auth/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongodb", () => ({ getMongoClient: () => ({ db: () => ({}) }) }));
vi.mock("@better-auth/mongo-adapter", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  const database = { user: [], account: [], session: [], verification: [], rateLimit: [] };
  const adapter = memoryAdapter(database);
  return {
    mongodbAdapter: () => (options: Parameters<typeof adapter>[0]) =>
      adapter({ ...options, advanced: { ...options.advanced, database: { generateId: "uuid" } } }),
  };
});

const origin = "http://localhost:3000";
const signup = {
  name: "  Test Account  ",
  email: "test-account@example.com",
  contactPhone: "+919876543210",
  password: "a",
  callbackURL: "/login?verified=1",
};

let attempt = 0;
async function post(path: string, data: object) {
  return (await getAuth()).handler(new Request(`${origin}/api/auth/${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", "x-forwarded-for": `192.0.2.${++attempt}` },
    body: JSON.stringify(data),
  }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("validates registration and password recovery against Better Auth", async () => {
  for (const [key, value] of Object.entries({
    DATABASE_URL: "mongodb://localhost:27017",
    DATABASE_NAME: "auth_test",
    BETTER_AUTH_SECRET: "synthetic-test-secret-credentials-123456789",
    BETTER_AUTH_URL: origin,
    GOOGLE_CLIENT_ID: "test",
    GOOGLE_CLIENT_SECRET: "test",
    AUTH_USE_MAILPIT: "false",
    AUTH_RESEND_API_KEY: "test-only",
    AUTH_VERIFICATION_FROM: "sender@example.com",
  })) vi.stubEnv(key, value);

  const deliver = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", deliver);

  expect((await post("sign-up/email", { ...signup, contactPhone: "123" })).status).toBe(400);
  expect((await post("sign-up/email", { ...signup, email: "invalid" })).status).toBe(400);
  expect((await post("sign-up/email", { ...signup, email: "missing-domain@example" })).status).toBe(400);
  expect((await post("sign-up/email", { ...signup, password: "" })).status).toBe(400);
  expect(deliver).not.toHaveBeenCalled();

  const registration = await post("sign-up/email", signup);
  expect(registration.status).toBe(200);
  expect(await registration.json()).toMatchObject({
    token: null, user: { email: signup.email, name: "Test Account", emailVerified: false },
  });
  expect(registration.headers.get("set-cookie")).toBeNull();
  expect(deliver).toHaveBeenCalledTimes(1);
  const delivery = JSON.parse(String(deliver.mock.calls[0][1]?.body));
  const verificationUrl = delivery.text.split("\n\n")[1];

  const unverifiedDuplicate = await post("sign-up/email", {
    ...signup, email: signup.email.toUpperCase(),
  });
  expect(unverifiedDuplicate.status).toBe(422);
  expect(await unverifiedDuplicate.json()).toMatchObject({
    code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  });
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(unverifiedDuplicate.headers.get("set-cookie")).toBeNull();

  const login = { email: signup.email, password: signup.password };
  const beforeVerification = await post("sign-in/email", login);
  expect(beforeVerification.status).toBe(403);
  expect(await beforeVerification.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });

  const verification = await (await getAuth()).handler(new Request(verificationUrl));
  expect(verification.headers.get("location")).toBe("/login?verified=1");
  expect((await post("sign-in/email", { ...login, password: "wrong-test-password" })).status).toBe(401);
  const authenticated = await post("sign-in/email", login);
  expect(authenticated.status).toBe(200);
  const session = await authenticated.json();
  expect(session.user).toMatchObject({ email: signup.email, emailVerified: true });
  expect(session.user).not.toHaveProperty("contactPhone");
  const cookie = authenticated.headers.get("set-cookie")?.split(";")[0];
  expect(cookie).toContain("session_token=");

  const deliveriesBeforeDuplicate = deliver.mock.calls.length;
  const duplicate = await post("sign-up/email", signup);
  expect(duplicate.status).toBe(422);
  expect(await duplicate.json()).toMatchObject({
    code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  });
  expect(duplicate.headers.get("set-cookie")).toBeNull();
  expect(deliver).toHaveBeenCalledTimes(deliveriesBeforeDuplicate);

  const attemptsBefore = deliver.mock.calls.length;
  const unknown = await post("email-otp/request-password-reset", { email: "unknown@example.com" });
  expect(unknown.status).toBe(200);
  expect(deliver).toHaveBeenCalledTimes(attemptsBefore);
  const request = await post("email-otp/request-password-reset", { email: signup.email });
  expect(await request.json()).toEqual(await unknown.json());
  const resetMessage = JSON.parse(String(deliver.mock.lastCall?.[1]?.body));
  expect(resetMessage.to).toEqual([signup.email]);
  const otp = /code is (\d{6})\./.exec(resetMessage.text)?.[1];
  expect(otp).toBeDefined();
  const check = { email: signup.email, otp, type: "forget-password" };
  expect((await post("email-otp/check-verification-otp", { ...check, type: "sign-in" })).ok).toBe(false);
  expect((await post("email-otp/check-verification-otp", {
    ...check, otp: otp === "123456" ? "654321" : "123456",
  })).ok).toBe(false);
  expect(await (await post("email-otp/check-verification-otp", check)).json()).toEqual({ success: true });
  const reset = { email: signup.email, otp, password: "b" };
  expect((await post("email-otp/reset-password", { ...reset, otp: otp === "123456" ? "654321" : "123456" })).ok).toBe(false);
  expect((await post("email-otp/reset-password", reset)).ok).toBe(true);
  expect((await post("email-otp/reset-password", reset)).ok).toBe(false);
  expect((await post("email-otp/check-verification-otp", check)).ok).toBe(false);
  expect((await post("sign-in/email", login)).status).toBe(401);
  expect((await post("sign-in/email", { ...login, password: reset.password })).status).toBe(200);
  const revoked = await (await getAuth()).handler(new Request(`${origin}/api/auth/get-session`, {
    headers: { cookie: cookie ?? "" },
  }));
  expect(await revoked.json()).toBeNull();
});
