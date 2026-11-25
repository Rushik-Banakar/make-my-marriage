import { getSession } from "@/lib/auth/server";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { getMyWedding } from "@/modules/weddings/service";
import { handleWeddingLifecycle } from "@/modules/weddings/lifecycle-http";
import { withRequestLog } from "@/lib/http/request-log";

export const runtime = "nodejs";

async function get(request: Request, { params }: { params: Promise<{ weddingId: string }> }) {
  try {
    const session = await getSession(request.headers);
    if (!session) return apiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    const { weddingId } = await params;
    const wedding = await getMyWedding(weddingId, session.user.id);
    if (!wedding) return apiError(404, "RESOURCE_NOT_FOUND", "Wedding not found.");
    return apiSuccess(wedding);
  } catch {
    return apiError(503, "DEPENDENCY_UNAVAILABLE", "Your wedding could not be loaded. Please try again.");
  }
}

type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: Request, context: Context) {
  return withRequestLog(request, "weddings.detail", () => get(request, context));
}
export async function DELETE(request: Request, { params }: Context) {
  return withRequestLog(request, "weddings.delete", async () => handleWeddingLifecycle(request, (await params).weddingId));
}
