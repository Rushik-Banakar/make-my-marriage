import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const log = vi.hoisted(() => ({ insert: vi.fn(), after: vi.fn<(work: () => Promise<void>) => void>(), fail: false }));
vi.mock("next/server", () => ({ after: log.after }));
vi.mock("@/lib/db/mongodb", () => ({ getDatabase: async () => {
  if (log.fail) throw new Error("private connection string");
  return { collection: () => ({ insertOne: log.insert }) };
} }));
import { withRequestLog } from "@/lib/http/request-log";
beforeEach(() => { log.fail = false; log.insert.mockResolvedValue({}); });
it("stores bounded request metadata without headers, tokens, query strings or bodies", async () => {
  const response = await withRequestLog(new Request("http://localhost/api/auth/reset-password?token=secret", {
    method: "POST", headers: { cookie: "session=secret" }, body: "private-password",
  }), "auth", async () => new Response(null, { status: 401 }));
  expect(log.insert).not.toHaveBeenCalled();
  await log.after.mock.calls[0][0]();
  const record = log.insert.mock.calls[0][0];
  expect(record).toMatchObject({ route: "auth", method: "POST", status: 401 });
  expect(record.requestId).toBe(response.headers.get("X-Request-Id"));
  expect(JSON.stringify(record)).not.toMatch(/secret|password|cookie|token/);
});
it("preserves the application response if durable request logging is unavailable", async () => {
  log.fail = true;
  const response = await withRequestLog(new Request("http://localhost/api/v1/me"), "account.me", async () => new Response("safe", { status: 503 }));
  expect(response.status).toBe(503); expect(await response.text()).toBe("safe");
  await expect(log.after.mock.calls[0][0]()).resolves.toBeUndefined();
});
