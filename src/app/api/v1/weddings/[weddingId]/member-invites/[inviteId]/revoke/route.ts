import { inviteRequest } from "@/modules/weddings/invite-http";
import { cancelPartnerInvite } from "@/modules/weddings/partner-invites";

type Context = { params: Promise<{ weddingId: string; inviteId: string }> };

export function POST(request: Request, { params }: Context) {
  return inviteRequest(request, "memberInvites.cancel", async user => {
    const { weddingId, inviteId } = await params;
    return cancelPartnerInvite(weddingId, user.id, inviteId);
  });
}
