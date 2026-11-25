import { withRequestLog } from "@/lib/http/request-log";
import { getSession } from "@/lib/auth/server";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { listMyWeddings } from "@/modules/weddings/service";

export const runtime = "nodejs";

async function get(request: Request) {
  try {
    const session = await getSession(request.headers);
    if (!session)
      return apiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    const memberships = await listMyWeddings(session.user.id);
    return apiSuccess({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      memberships,
    });
  } catch {
    return apiError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Your account could not be loaded. Please try again.",
    );
  }
}

export async function GET(request: Request) {
  return withRequestLog(request, "account.me", () => get(request));
}
