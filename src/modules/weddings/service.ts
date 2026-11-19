import "server-only";
import { findMembershipWeddings } from "@/modules/weddings/repository";

export async function listMyWeddings(authUserId: string) {
  const memberships = await findMembershipWeddings(authUserId);
  return memberships.map(({ weddingId, role, ownerSeat, wedding }) => ({
    id: weddingId.toHexString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startAt: wedding.startAt.toISOString(),
    timezone: wedding.timezone,
    status: wedding.status,
    myRole: role,
    ...(role === "admin" && ownerSeat ? { ownerSeat } : {}),
  }));
}
