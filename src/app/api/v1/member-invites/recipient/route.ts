import { z } from "zod";
import { inviteBody, inviteRequest } from "@/modules/weddings/invite-http";
import { recipientInvite } from "@/modules/weddings/partner-invites";

// The web client keeps the bearer token out of HTTP URLs and access logs.
export function POST(request: Request) {
  return inviteRequest(request, "memberInvites.recipient", async user => {
    const { token, action } = z.strictObject({ token: z.string(), action: z.enum(["review", "accept"]) }).parse(await inviteBody(request));
    return recipientInvite(token, user, action === "accept");
  });
}
