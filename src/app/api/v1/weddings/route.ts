import { getSession } from "@/lib/auth/server";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { listMyWeddings } from "@/modules/weddings/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSession(request.headers);
    if (!session)
      return apiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    return apiSuccess(await listMyWeddings(session.user.id));
  } catch {
    return apiError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Your weddings could not be loaded. Please try again.",
    );
  }
}
