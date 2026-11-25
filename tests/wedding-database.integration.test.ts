import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { ObjectId } from "mongodb";

vi.mock("server-only", () => ({}));
const mail = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/verification-email", () => ({ sendAuthEmail: mail }));

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
  for (const name of ["events", "memberInvites", "weddingMembers", "weddingSites", "weddingBudgets", "weddingPlans", "storageUsage", "auditEvents"]) {
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
  const { sendPartnerInvite, recipientInvite, partnerPanel, cancelPartnerInvite } = await import("@/modules/weddings/partner-invites");
  const creator = { id: owner, email: "creator@example.test", name: "Creator", emailVerified: true };
  const partner = { ...creator, id: outsider, email: "partner-" + run + "@example.test" };
  await expect(sendPartnerInvite(created!.id, partner, creator.email)).rejects.toMatchObject({ status: 404 });
  await expect(sendPartnerInvite(created!.id, creator, creator.email)).rejects.toMatchObject({ status: 422 });
  const first = await sendPartnerInvite(created!.id, creator, partner.email);
  const firstToken = mail.mock.calls[0][2].split("#").pop();
  await expect(recipientInvite(firstToken, creator, true)).rejects.toMatchObject({ status: 403 });
  await expect(recipientInvite(firstToken, { ...partner, emailVerified: false }, true)).rejects.toMatchObject({ status: 403 });
  await expect(sendPartnerInvite(created!.id, creator, partner.email, first.inviteId)).rejects.toMatchObject({ status: 429 });
  await cancelPartnerInvite(created!.id, owner, first.inviteId);
  await expect(recipientInvite(firstToken, partner, true)).rejects.toMatchObject({ status: 404 });
  await db.collection("weddings").updateOne({ _id: weddingId }, { $unset: { lastPartnerInviteAt: "" } });
  mail.mockRejectedValueOnce(new Error("Synthetic mail provider failure"));
  await expect(sendPartnerInvite(created!.id, creator, partner.email)).rejects.toMatchObject({ status: 503 });
  const failed = (await partnerPanel(created!.id, owner)).invitation!;
  expect(failed.failed).toBe(true);
  await db.collection("weddings").updateOne({ _id: weddingId }, { $unset: { lastPartnerInviteAt: "" } });
  const expired = await sendPartnerInvite(created!.id, creator, partner.email, failed.id);
  expect(await db.collection("auditEvents").distinct("entityId", { weddingId, action: "memberInvite.revoked", actorAuthUserId: owner }))
    .toEqual(expect.arrayContaining([first.inviteId, failed.id]));
  await db.collection("memberInvites").updateOne({ _id: new ObjectId(expired.inviteId) }, { $set: { expiresAt: new Date(0) } });
  await expect(recipientInvite(mail.mock.calls[2][2].split("#").pop(), partner, true)).rejects.toMatchObject({ status: 404 });
  await db.collection("weddings").updateOne({ _id: weddingId }, { $unset: { lastPartnerInviteAt: "" } });
  await sendPartnerInvite(created!.id, creator, partner.email);
  const token = mail.mock.calls[3][2].split("#").pop();
  expect(await recipientInvite(token, partner, false)).toMatchObject({ weddingId: created!.id });
  const attempts = await Promise.allSettled([recipientInvite(token, partner, true), recipientInvite(token, partner, true)]);
  expect(attempts.filter(attempt => attempt.status === "fulfilled")).toHaveLength(1);
  expect(await partnerPanel(created!.id, owner)).toMatchObject({ joined: true });
  const { saveEvent, readEvents } = await import("@/modules/planning/events");
  const ceremony = { name: "Family puja", startAt: "2027-02-14T06:30:00Z", endAt: "2027-02-14T08:00:00Z", instructions: "Meet in the hall" };
  const saved = await saveEvent(created!.id, owner, ceremony);
  const earlier = await saveEvent(created!.id, outsider, { ...ceremony, startAt: "2027-02-13T06:30:00Z" });
  expect((await readEvents(created!.id, owner)).map(e => e.id)).toEqual([earlier.id, saved.id]);
  await expect(saveEvent(created!.id, outsider, { name: "Morning puja", expectedVersion: 1 }, saved.id))
    .resolves.toMatchObject({ version: 2, instructions: ceremony.instructions, visibility: "invitedOnly" });
  await expect(saveEvent(created!.id, owner, { status: "cancelled", expectedVersion: 1 }, saved.id)).rejects.toMatchObject({ status: 409 });
  await saveEvent(created!.id, owner, { status: "cancelled" }, saved.id);
  expect((await readEvents(created!.id, outsider, { scheduled: true })).map(e => e.id)).toEqual([earlier.id]);
  await expect(readEvents(created!.id, "unrelated")).rejects.toMatchObject({ status: 404 });
  expect(await getMyWedding(created!.id, outsider)).toMatchObject({ myRole: "admin", ownerSeat: "groom" });
  await expect(changeWeddingLifecycle(created!.id, owner, slug)).rejects.toMatchObject({ status: 409 });
}, 30000);
