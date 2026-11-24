import { afterEach, expect, it, vi } from "vitest";
import type { AuthEnvironment } from "@/lib/auth/config";

vi.mock("server-only", () => ({}));
const driver = vi.hoisted(() => ({ connect: vi.fn(), close: vi.fn(), constructed: vi.fn() }));
vi.mock("mongodb", () => ({
  MongoClient: class {
    constructor() { driver.constructed(); }
    connect = () => driver.connect(this);
    close = driver.close;
  },
}));

const config = { DATABASE_URL: "mongodb://localhost:27017" } as AuthEnvironment;
afterEach(() => {
  delete (globalThis as typeof globalThis & { marriageMongoConnection?: unknown }).marriageMongoConnection;
  vi.resetAllMocks();
});

it("shares an explicit connection and discards failed initialization so a later request recovers", async () => {
  const { getMongoClient } = await import("@/lib/db/mongodb");
  const unavailable = new Error("temporary TLS failure");
  driver.connect.mockRejectedValueOnce(unavailable).mockImplementation(async (client) => client);
  driver.close.mockResolvedValue(undefined);
  const first = getMongoClient(config);
  const concurrent = getMongoClient(config);
  expect(concurrent).toBe(first);
  await expect(first).rejects.toBe(unavailable);
  expect(driver.close).toHaveBeenCalledTimes(1);
  const recovered = await getMongoClient(config);
  expect(await getMongoClient(config)).toBe(recovered);
  expect(driver.constructed).toHaveBeenCalledTimes(2);
  expect(driver.connect).toHaveBeenCalledTimes(2);
});
