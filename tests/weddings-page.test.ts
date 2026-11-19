import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const pageDependencies = vi.hoisted(() => ({
  session: vi.fn(),
  weddings: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({ getSession: pageDependencies.session }));
vi.mock("@/modules/weddings/service", () => ({
  listMyWeddings: pageDependencies.weddings,
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/components/account/auth-controls", () => ({
  SignOutButton: () => null,
}));
import MyWeddingsPage from "@/app/(organizer)/weddings/page";

beforeEach(() => {
  pageDependencies.session.mockResolvedValue(null);
  pageDependencies.weddings.mockResolvedValue([]);
});

it("redirects anonymous visitors before reading any wedding information", async () => {
  await expect(MyWeddingsPage()).rejects.toThrow("redirect:/login");
  expect(pageDependencies.weddings).not.toHaveBeenCalled();
});

it("renders an honest empty state for a new account without a demo membership", async () => {
  pageDependencies.session.mockResolvedValue({
    user: { id: "new-account", name: "Test User" },
  });
  const html = renderToStaticMarkup(await MyWeddingsPage());
  expect(pageDependencies.weddings).toHaveBeenCalledWith("new-account");
  expect(html).toContain("Your celebrations will live here.");
  expect(html).not.toContain("Aarav");
  expect(html).not.toContain("wedding-card-cover");
});

it("does not turn a failed membership query into an empty state", async () => {
  pageDependencies.session.mockResolvedValue({
    user: { id: "new-account", name: "Test User" },
  });
  pageDependencies.weddings.mockRejectedValue(new Error("storage unavailable"));
  await expect(MyWeddingsPage()).rejects.toThrow("storage unavailable");
});
