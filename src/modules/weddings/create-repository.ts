import "server-only";
import { Long, ObjectId, type Db, type MongoClient } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { CreateWeddingInput } from "@/modules/weddings/schema";

const readyByClient = new WeakMap<MongoClient, Map<string, Promise<void>>>();

async function requireSlugIndex(db: Db) {
  let databases = readyByClient.get(db.client);
  if (!databases) {
    databases = new Map();
    readyByClient.set(db.client, databases);
  }
  let ready = databases.get(db.databaseName);
  if (!ready) {
    ready = db.collection("weddings").listIndexes().toArray().then((indexes) => {
      const uniqueSlug = indexes.some((index) =>
        index.unique === true && index.key.slug === 1 && Object.keys(index.key).length === 1 &&
        !index.sparse && !index.partialFilterExpression);
      if (!uniqueSlug) throw new Error("Wedding slug index missing. Run npm run db:setup.");
    }).catch((error: unknown) => {
      databases.delete(db.databaseName);
      throw error;
    });
    databases.set(db.databaseName, ready);
  }
  await ready;
}

export async function insertWeddingWithOwner(input: CreateWeddingInput, authUserId: string) {
  const db = await getDatabase();
  await requireSlugIndex(db);
  const weddingId = new ObjectId();
  const now = new Date();
  const common = { weddingId, createdAt: now, updatedAt: now };
  const session = db.client.startSession();
  try {
    await session.withTransaction(async () => {
      const options = { session };
      await db.collection("weddings").insertOne({
        _id: weddingId, slug: input.slug, brideName: input.brideName, groomName: input.groomName,
        ...(input.location ? { location: input.location } : {}),
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        startAt: new Date(input.startAt), timezone: input.timezone, status: "draft", demoMode: false,
        createdByAuthUserId: authUserId, createdAt: now, updatedAt: now,
      }, options);
      await db.collection("weddingMembers").insertOne({
        ...common, authUserId, role: "admin", ownerSeat: input.initialOwnerSeat,
        status: "active", joinedAt: now,
      }, options);
      await db.collection("weddingSites").insertOne({
        ...common, isPublished: false, publicEventIds: [], updatedByAuthUserId: authUserId,
      }, options);
      await db.collection("weddingBudgets").insertOne({
        ...common, budgetPaise: Long.ZERO, currency: "INR", version: 1, updatedByAuthUserId: authUserId,
      }, options);
      // Uploads stay disabled until the media milestone defines free quotas.
      await db.collection("weddingPlans").insertOne({
        ...common, planCode: "free", maxPhotos: 0, maxStorageBytes: Long.ZERO,
        activatedAt: now, isSimulated: true,
      }, options);
      await db.collection("storageUsage").insertOne({
        ...common, originalBytes: Long.ZERO, thumbnailBytes: Long.ZERO, assetCount: 0, reservedBytes: Long.ZERO,
      }, options);
      await db.collection("auditEvents").insertOne({
        ...common, actorAuthUserId: authUserId, action: "wedding.created", entityType: "weddings",
        entityId: weddingId.toHexString(), occurredAt: now, outcome: "success",
      }, options);
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
  } finally {
    await session.endSession();
  }
  return { id: weddingId.toHexString(), slug: input.slug, status: "draft" as const,
    myRole: "admin" as const, ownerSeat: input.initialOwnerSeat };
}
