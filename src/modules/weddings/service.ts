import "server-only";
import { findMembershipWeddings } from "@/modules/weddings/repository";
import { ObjectId } from "mongodb";
import { findWeddingById } from "@/modules/weddings/repository";
import { findActiveWeddingMember } from "@/lib/permissions/wedding-access";
import { createWeddingSchema } from "@/modules/weddings/schema";
import { insertWeddingWithOwner } from "@/modules/weddings/create-repository";

export async function createWedding(input: unknown, authUserId: string) {
  if (!authUserId) throw new Error("Authenticated user ID required");
  return insertWeddingWithOwner(createWeddingSchema.parse(input), authUserId);
}

export async function getMyWedding(id: string, authUserId: string) {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const weddingId = new ObjectId(id);
  const member = await findActiveWeddingMember(weddingId, authUserId);
  if (!member) return null;
  const wedding = await findWeddingById(weddingId);
  if (!wedding) return null;
  return { id: wedding._id.toHexString(), brideName: wedding.brideName as string,
    groomName: wedding.groomName as string, startAt: (wedding.startAt as Date).toISOString(),
    timezone: wedding.timezone as string, status: wedding.status as string, slug: wedding.slug as string,
    location: wedding.location as string | undefined, title: wedding.title as string | undefined,
    description: wedding.description as string | undefined,
    myRole: member.role as "admin" | "manager",
    ...(member.role === "admin" ? { ownerSeat: member.ownerSeat as "bride" | "groom" } : {}),
  };
}

export async function listMyWeddings(authUserId: string, deleted = false) {
  const memberships = await findMembershipWeddings(authUserId, deleted);
  return memberships.map(({ weddingId, role, ownerSeat, wedding }) => ({
    id: weddingId.toHexString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startAt: wedding.startAt.toISOString(),
    timezone: wedding.timezone,
    status: wedding.status,
    ...(wedding.slug ? { slug: wedding.slug } : {}),
    myRole: role,
    ...(role === "admin" && ownerSeat ? { ownerSeat } : {}),
  }));
}
