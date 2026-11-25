import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const dependencies = vi.hoisted(() => ({ session: vi.fn(), change: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ getSession: dependencies.session }));
vi.mock("@/lib/auth/config", () => ({ readAuthEnvironment: () => ({ BETTER_AUTH_URL: "http://localhost:3000" }) }));
vi.mock("@/modules/weddings/lifecycle", () => ({
  changeWeddingLifecycle: dependencies.change,
  WeddingLifecycleError: class extends Error {},
}));
import { handleWeddingLifecycle } from "@/modules/weddings/lifecycle-http";
beforeEach(() => { dependencies.session.mockResolvedValue({ user: { id: "owner" } }); dependencies.change.mockResolvedValue({ deleted: true }); });
function request(body: unknown = { confirmationSlug: "our-wedding" }, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/v1/weddings/123", { method: "DELETE", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}
it("rejects anonymous, cross-origin and privileged-field requests before mutation", async () => {
  dependencies.session.mockResolvedValueOnce(null);
  expect((await handleWeddingLifecycle(request(), "123")).status).toBe(401);
  expect((await handleWeddingLifecycle(request(undefined, "https://attacker.example"), "123")).status).toBe(403);
  expect((await handleWeddingLifecycle(request({ confirmationSlug: "our-wedding", actor: "victim" }), "123")).status).toBe(422);
  expect(dependencies.change).not.toHaveBeenCalled();
});
it("uses session identity for both deletion and restoration", async () => {
  expect((await handleWeddingLifecycle(request(), "123")).status).toBe(200);
  expect(dependencies.change).toHaveBeenCalledWith("123", "owner", "our-wedding", false);
  await handleWeddingLifecycle(request(), "123", true);
  expect(dependencies.change).toHaveBeenCalledWith("123", "owner", "our-wedding", true);
});
