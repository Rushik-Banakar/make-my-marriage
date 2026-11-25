import { inviteRequest } from "@/modules/weddings/invite-http";
import { recipientInvite } from "@/modules/weddings/partner-invites";

export function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return inviteRequest(request, "memberInvites.accept", async user => recipientInvite((await params).token, user, true));
}
