import { beforeEach, expect, it, vi } from "vitest";
import { ObjectId, type Document } from "mongodb";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  wedding: {} as Document, pending: {} as Document, audits: [] as Document[], pendingAudits: [] as Document[],
  role: "admin", actor: "owner", owners: 1, failAudit: false, session: {} as object,
}));
vi.mock("@/lib/db/mongodb", () => ({ getDatabase: async () => ({
  client: { startSession: () => ({
    async withTransaction(work: () => Promise<void>) {
      fixture.pending = { ...fixture.wedding }; fixture.pendingAudits = [];
      await work();
      fixture.wedding = fixture.pending; fixture.audits.push(...fixture.pendingAudits);
    }, async endSession() {},
  }) },
  collection: (name: string) => ({
    async findOne(filter: Document) {
      if (name === "weddingMembers") return filter.authUserId === fixture.actor && filter.role === fixture.role ? { role: fixture.role } : null;
      if (name === "weddings") {
        if (filter.deletedByAuthUserId && filter.deletedByAuthUserId !== fixture.pending.deletedByAuthUserId) return null;
        return Boolean(fixture.pending.deletedAt) === filter.deletedAt.$exists ? fixture.pending : null;
      }
      return null;
    },
    async countDocuments() { return fixture.owners; },
    async updateOne(_filter: Document, update: Document) {
      if (name === "weddings") {
        Object.assign(fixture.pending, update.$set);
        for (const key of Object.keys(update.$unset ?? {})) delete fixture.pending[key];
      }
      return { modifiedCount: 1 };
    },
    async insertOne(document: Document) {
      if (fixture.failAudit) throw new Error("audit unavailable");
      fixture.pendingAudits.push(document);
    },
  }),
}) }));
import { changeWeddingLifecycle } from "@/modules/weddings/lifecycle";
import { membershipWeddingPipeline } from "@/modules/weddings/repository";
const id = new ObjectId().toHexString();
beforeEach(() => {
  fixture.wedding = { _id: new ObjectId(id), slug: "our-wedding", status: "draft" };
  fixture.audits = []; fixture.role = "admin"; fixture.actor = "owner"; fixture.owners = 1; fixture.failAudit = false;
});

it("requires a current owner and an exact typed confirmation", async () => {
  await expect(changeWeddingLifecycle(id, "outsider", "our-wedding")).rejects.toMatchObject({ status: 404 });
  fixture.role = "manager";
  await expect(changeWeddingLifecycle(id, "owner", "our-wedding")).rejects.toMatchObject({ status: 404 });
  fixture.role = "admin";
  await expect(changeWeddingLifecycle(id, "owner", "wrong-address")).rejects.toMatchObject({ status: 422 });
  expect(fixture.wedding.deletedAt).toBeUndefined(); expect(fixture.audits).toEqual([]);
});

it("blocks unilateral multi-owner deletion", async () => {
  fixture.owners = 2;
  await expect(changeWeddingLifecycle(id, "owner", "our-wedding")).rejects.toMatchObject({ status: 409 });
  expect(fixture.wedding.deletedAt).toBeUndefined();
});

it("retains the wedding and audit history, and restores only for the deleting owner", async () => {
  expect(await changeWeddingLifecycle(id, "owner", "our-wedding")).toEqual({ id, deleted: true });
  expect(fixture.wedding).toMatchObject({ slug: "our-wedding", status: "draft", deletedByAuthUserId: "owner" });
  expect(fixture.wedding.deletedAt).toBeInstanceOf(Date);
  fixture.actor = "other-owner";
  await expect(changeWeddingLifecycle(id, "other-owner", "our-wedding", true)).rejects.toMatchObject({ status: 404 });
  fixture.actor = "owner";
  expect(await changeWeddingLifecycle(id, "owner", "our-wedding", true)).toEqual({ id, deleted: false });
  expect(fixture.wedding.deletedAt).toBeUndefined();
  expect(fixture.audits.map((event) => event.action)).toEqual(["wedding.deleted", "wedding.restored"]);
});

it("rolls back the change if its audit event cannot be persisted", async () => {
  fixture.failAudit = true;
  await expect(changeWeddingLifecycle(id, "owner", "our-wedding")).rejects.toThrow("audit unavailable");
  expect(fixture.wedding.deletedAt).toBeUndefined(); expect(fixture.audits).toEqual([]);
});

it("excludes deleted weddings before summary projection and scopes the recovery list", () => {
  const active = JSON.stringify(membershipWeddingPipeline("owner"));
  const deleted = JSON.stringify(membershipWeddingPipeline("owner", true));
  expect(active).toContain('"deletedAt":{"$exists":false}');
  expect(deleted).toContain('"deletedByAuthUserId":"owner"');
});
