import { beforeEach, expect, it, vi } from "vitest";
import type { Document } from "mongodb";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  committed: [] as { collection: string; document: Document }[],
  pending: [] as { collection: string; document: Document }[],
  failAt: "", hasUniqueSlug: true, end: vi.fn(), session: {} as object,
}));
vi.mock("@/lib/db/mongodb", () => ({
  getDatabase: async () => ({
    databaseName: "transaction-test", client: {
      startSession: () => ({
        async withTransaction(work: () => Promise<void>) {
          fixture.pending = [];
          await work();
          fixture.committed.push(...fixture.pending);
        },
        endSession: fixture.end,
      }),
    },
    collection: (collection: string) => ({
      listIndexes: () => ({ toArray: async () => fixture.hasUniqueSlug ? [{ key: { slug: 1 }, unique: true }] : [] }),
      async insertOne(document: Document, options: { session?: object }) {
        if (collection === fixture.failAt) throw new Error("storage failure");
        const target = options.session ? fixture.pending : fixture.committed;
        target.push({ collection, document });
      },
    }),
  }),
}));
import { insertWeddingWithOwner } from "@/modules/weddings/create-repository";

const input = { brideName: "Ananya", groomName: "Arjun", slug: "ananya-arjun",
  startAt: "2027-02-14T06:30:00.000Z", timezone: "Asia/Kolkata", initialOwnerSeat: "bride" as const };
beforeEach(() => { fixture.committed = []; fixture.pending = []; fixture.failAt = ""; fixture.hasUniqueSlug = true; });

it("refuses to create a wedding before the unique slug index is provisioned", async () => {
  fixture.hasUniqueSlug = false;
  await expect(insertWeddingWithOwner(input, "owner-account")).rejects.toThrow("Run npm run db:setup");
  expect(fixture.committed).toHaveLength(0);
});

it("persists the complete private draft and only one initial owner", async () => {
  const result = await insertWeddingWithOwner({ ...input, location: "Jaipur", title: "Forever Begins", description: "With our families" }, "owner-account");
  expect(result).toMatchObject({ status: "draft", ownerSeat: "bride", myRole: "admin" });
  expect(fixture.committed).toHaveLength(7);
  const records = Object.fromEntries(fixture.committed.map(({ collection, document }) => [collection, document]));
  expect(records.weddings).toMatchObject({ demoMode: false, createdByAuthUserId: "owner-account", status: "draft", location: "Jaipur", title: "Forever Begins", description: "With our families" });
  expect(records.weddingMembers).toMatchObject({ authUserId: "owner-account", role: "admin", ownerSeat: "bride", status: "active" });
  expect(records.weddingSites).toMatchObject({ isPublished: false, publicEventIds: [] });
  expect(records.weddingBudgets.budgetPaise.toString()).toBe("0");
  expect(records.weddingPlans).toMatchObject({ planCode: "free", isSimulated: true, maxPhotos: 0 });
  expect(records.storageUsage.assetCount).toBe(0);
  expect(records.auditEvents.action).toBe("wedding.created");
  expect(records.weddingMembers.weddingId.toHexString()).toBe(result.id);
  expect(fixture.end).toHaveBeenCalledTimes(1);
});

it("does not commit a wedding or membership if a later required record fails", async () => {
  fixture.failAt = "storageUsage";
  await expect(insertWeddingWithOwner(input, "owner-account")).rejects.toThrow("storage failure");
  expect(fixture.committed).toHaveLength(0);
  expect(fixture.end).toHaveBeenCalledTimes(1);
});
