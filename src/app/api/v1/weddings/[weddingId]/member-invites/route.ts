import { z } from "zod";
import { inviteBody, inviteRequest } from "@/modules/weddings/invite-http";
import { cancelPartnerInvite, sendPartnerInvite } from "@/modules/weddings/partner-invites";
type Context = { params: Promise<{ weddingId: string }> };

export function POST(request: Request, { params }: Context) {
  return inviteRequest(request, "memberInvites.send", async user => {
    const input = z.strictObject({ email: z.string(), role: z.literal("admin"), replaceId: z.string().optional() }).parse(await inviteBody(request));
    return sendPartnerInvite((await params).weddingId, user, input.email, input.replaceId);
  }, 201);
}
export function DELETE(request: Request, { params }: Context) {
  return inviteRequest(request, "memberInvites.cancel", async user => {
    const { inviteId } = z.strictObject({ inviteId: z.string() }).parse(await inviteBody(request));
    return cancelPartnerInvite((await params).weddingId, user.id, inviteId);
  });
}
