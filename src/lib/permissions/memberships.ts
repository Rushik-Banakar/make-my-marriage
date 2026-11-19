// Identity comes from a validated server session, never a request query or body.
export function activeMembershipFilter(authUserId: string) {
  if (!authUserId) throw new Error("Authenticated user ID required");
  return { authUserId, status: "active" as const };
}
