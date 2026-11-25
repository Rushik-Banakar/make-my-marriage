import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { findWeddingAdmin } from "@/lib/permissions/wedding-access";

export class WeddingLifecycleError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function changeWeddingLifecycle(id: string, actor: string, confirmationSlug: string, restore = false) {
  const missing = () => new WeddingLifecycleError(404, "RESOURCE_NOT_FOUND", "Wedding not found.");
  if (!/^[a-f0-9]{24}$/i.test(id) || !actor) throw missing();
  const weddingId = new ObjectId(id);
  const db = await getDatabase();
  const session = db.client.startSession();
  try {
    await session.withTransaction(async () => {
      if (!await findWeddingAdmin(db, weddingId, actor, session)) throw missing();
      const filter = { _id: weddingId, ...(restore
        ? { deletedAt: { $exists: true }, deletedByAuthUserId: actor }
        : { deletedAt: { $exists: false } }) };
      const wedding = await db.collection("weddings").findOne(filter, { session });
      if (!wedding) throw missing();
      if (confirmationSlug !== wedding.slug) throw new WeddingLifecycleError(422, "CONFIRMATION_REQUIRED", "Enter the wedding website address exactly to confirm.");
      // Multi-owner deletion needs a consent workflow before it can be enabled.
      if (!restore && await db.collection("weddingMembers").countDocuments({ weddingId, role: "admin", status: "active" }, { session }) !== 1) {
        throw new WeddingLifecycleError(409, "CO_OWNER_CONFIRMATION_REQUIRED", "Weddings with multiple owners cannot be deleted until a shared confirmation process is available.");
      }
      const now = new Date();
      await db.collection("weddings").updateOne(filter, restore ? {
        $unset: { deletedAt: "", deletedByAuthUserId: "" }, $set: { updatedAt: now },
      } : { $set: { deletedAt: now, deletedByAuthUserId: actor, updatedAt: now } }, { session });
      // Never republish automatically when restoring a workspace.
      await db.collection("weddingSites").updateOne({ weddingId }, { $set: { isPublished: false, updatedAt: now, updatedByAuthUserId: actor } }, { session });
      await db.collection("auditEvents").insertOne({ weddingId, actorAuthUserId: actor,
        action: restore ? "wedding.restored" : "wedding.deleted", entityType: "weddings", entityId: id,
        occurredAt: now, outcome: "success", createdAt: now }, { session });
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
  } finally { await session.endSession(); }
  return { id, deleted: !restore };
}
