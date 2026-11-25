import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { ObjectId } from "mongodb";

vi.mock("server-only", () => ({}));

const enabled = process.env.RUN_DATABASE_TESTS === "true";
const run = randomUUID();
const owner = `qa-wedding-owner-${run}`;
const outsider = `qa-wedding-outsider-${run}`;
const slug = `qa-wedding-${run}`;
const input = { brideName: "Synthetic Bride", groomName: "Synthetic Groom", slug,
  startAt: "2027-02-14T06:30:00.000Z", timezone: "Asia/Kolkata", initialOwnerSeat: "bride" };

beforeAll(() => {
  if (!enabled) return;
  // This opt-in private test writes only uniquely named synthetic records.
  const environment = parseEnv(readFileSync(".env.local", "utf8"));
  for (const [key, value] of Object.entries(environment)) if (!process.env[key]) vi.stubEnv(key, value);
});

afterAll(async () => {
  if (!enabled) return;
  const { getDatabase } = await import("@/lib/db/mongodb");
  const db = await getDatabase();
  const weddings = await db.collection("weddings").find({ createdByAuthUserId: owner, slug }).toArray();
  const members = await db.collection("weddingMembers").find({ authUserId: owner }).toArray();
  const ids = [...weddings.map((w) => w._id), ...members.map((m) => m.weddingId as ObjectId)];
  for (const name of ["weddingMembers", "weddingSites", "weddingBudgets", "weddingPlans", "storageUsage", "auditEvents"]) {
    await db.collection(name).deleteMany({ weddingId: { $in: ids } });
  }
  await db.collection("weddings").deleteMany({ _id: { $in: ids }, createdByAuthUserId: owner, slug });
  vi.unstubAllEnvs();
});

it.skipIf(!enabled)("commits the full bundle, enforces concurrent slug uniqueness and isolates memberships in MongoDB", async () => {
  const { createWedding, getMyWedding, listMyWeddings } = await import("@/modules/weddings/service");
  const { getDatabase } = await import("@/lib/db/mongodb");
  const outcomes = await Promise.allSettled([createWedding(input, owner), createWedding(input, owner)]);
  const success = outcomes.filter((outcome) => outcome.status === "fulfilled");
  expect(success).toHaveLength(1);
  const failure = outcomes.find((outcome) => outcome.status === "rejected");
  expect(failure?.status === "rejected" && failure.reason.code).toBe(11000);
  const created = success[0].status === "fulfilled" ? success[0].value : null;
  expect(created).not.toBeNull();
  const db = await getDatabase();
  const weddingId = new ObjectId(created!.id);
  for (const name of ["weddingMembers", "weddingSites", "weddingBudgets", "weddingPlans", "storageUsage", "auditEvents"]) {
    expect(await db.collection(name).countDocuments({ weddingId })).toBe(1);
  }
  expect(await db.collection("weddingMembers").countDocuments({ authUserId: owner })).toBe(1);
  expect((await listMyWeddings(owner)).map((w) => w.id)).toEqual([created!.id]);
  expect(await listMyWeddings(outsider)).toEqual([]);
  expect(await getMyWedding(created!.id, outsider)).toBeNull();
  expect(await getMyWedding(created!.id, owner)).toMatchObject({ status: "draft", myRole: "admin", ownerSeat: "bride" });
  expect(await db.collection("weddingSites").findOne({ weddingId })).toMatchObject({ isPublished: false });
  const { changeWeddingLifecycle } = await import("@/modules/weddings/lifecycle");
  await expect(changeWeddingLifecycle(created!.id, outsider, slug)).rejects.toMatchObject({ status: 404 });
  await expect(changeWeddingLifecycle(created!.id, owner, "wrong-address")).rejects.toMatchObject({ status: 422 });
  await changeWeddingLifecycle(created!.id, owner, slug);
  expect(await getMyWedding(created!.id, owner)).toBeNull();
  expect(await listMyWeddings(owner)).toEqual([]);
  expect((await listMyWeddings(owner, true)).map((w) => w.id)).toEqual([created!.id]);
  expect(await db.collection("weddings").findOne({ _id: weddingId })).toMatchObject({ deletedByAuthUserId: owner });
  await changeWeddingLifecycle(created!.id, owner, slug, true);
  expect(await getMyWedding(created!.id, owner)).toMatchObject({ status: "draft" });
  expect(await db.collection("auditEvents").countDocuments({ weddingId })).toBe(3);
}, 30000);
