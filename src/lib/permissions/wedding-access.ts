import "server-only";
import { ObjectId, type ClientSession, type Db } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { activeMembershipFilter } from "@/lib/permissions/memberships";

export async function findActiveWeddingMember(weddingId: ObjectId, authUserId: string) {
  const db = await getDatabase();
  if (!await db.collection("weddings").findOne({ _id: weddingId, deletedAt: { $exists: false } }, { projection: { _id: 1 } })) return null;
  return db.collection("weddingMembers").findOne({
    weddingId, ...activeMembershipFilter(authUserId),
  }, { projection: { role: 1, ownerSeat: 1 } });
}

export async function findWeddingAdmin(db: Db, weddingId: ObjectId, authUserId: string, session: ClientSession) {
  return db.collection("weddingMembers").findOne({ weddingId, ...activeMembershipFilter(authUserId), role: "admin" }, { session });
}
