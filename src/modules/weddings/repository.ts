import "server-only";
import { getDatabase } from "@/lib/db/mongodb";
import { activeMembershipFilter } from "@/lib/permissions/memberships";
import { ObjectId } from "mongodb";

export type MembershipWedding = {
  weddingId: ObjectId;
  role: "admin" | "manager";
  ownerSeat?: "bride" | "groom";
  wedding: {
    brideName: string;
    groomName: string;
    startAt: Date;
    timezone: string;
    status: "draft" | "active" | "archived";
    slug?: string;
  };
};

export function membershipWeddingPipeline(authUserId: string, deleted = false) {
  return [
    { $match: { ...activeMembershipFilter(authUserId), ...(deleted ? { role: "admin" } : {}) } },
    {
      $lookup: {
        from: "weddings",
        localField: "weddingId",
        foreignField: "_id",
        as: "wedding",
        pipeline: [
          { $match: deleted ? { deletedAt: { $exists: true }, deletedByAuthUserId: authUserId } : { deletedAt: { $exists: false } } },
          {
            $project: {
              _id: 0,
              brideName: 1,
              groomName: 1,
              startAt: 1,
              timezone: 1,
              status: 1,
              slug: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$wedding" },
    { $sort: { "wedding.startAt": 1, weddingId: 1 } },
    { $project: { _id: 0, weddingId: 1, role: 1, ownerSeat: 1, wedding: 1 } },
  ];
}

export async function findMembershipWeddings(authUserId: string, deleted = false) {
  const db = await getDatabase();
  return db
    .collection("weddingMembers")
    .aggregate<MembershipWedding>(membershipWeddingPipeline(authUserId, deleted))
    .toArray();
}

export async function findWeddingById(weddingId: ObjectId) {
  const db = await getDatabase();
  return db.collection("weddings").findOne({ _id: weddingId, deletedAt: { $exists: false } }, {
    projection: { brideName: 1, groomName: 1, startAt: 1, timezone: 1, status: 1, slug: 1,
      location: 1, title: 1, description: 1 },
  });
}
