import { z } from "zod";
import { getSession } from "@/lib/auth/server";
import { readAuthEnvironment } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/http/responses";
import { withRequestLog } from "@/lib/http/request-log";
import { readJsonBody, RequestBodyError } from "@/lib/http/json-body";
import { InviteError } from "@/modules/weddings/partner-invites";

type User = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
export function inviteRequest(request: Request, route: string, work: (user: User) => Promise<unknown>, status = 200) {
  return withRequestLog(request, route, async () => {
    try {
      const user = (await getSession(request.headers))?.user;
      if (!user) return apiError(401, "AUTH_REQUIRED", "Sign in with the invited email address.");
      const config = readAuthEnvironment();
      if (!config) throw new Error("Missing configuration");
      if (request.headers.get("origin") !== new URL(config.BETTER_AUTH_URL).origin)
        return apiError(403, "INVALID_ORIGIN", "Open the invitation from this website.");
      return apiSuccess(await work(user), undefined, { status });
    } catch (error) {
      if (error instanceof InviteError) return apiError(error.status, "INVITATION_ERROR", error.message);
      if (error instanceof RequestBodyError) return apiError(error.status, error.code, error.message);
      if (error instanceof z.ZodError) return apiError(422, "VALIDATION_FAILED", "Check the invitation details and email address.");
      return apiError(503, "DEPENDENCY_UNAVAILABLE", "Invitations are temporarily unavailable.");
    }
  });
}
export const inviteBody = readJsonBody;
