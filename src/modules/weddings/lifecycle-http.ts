import { z, ZodError } from "zod";
import { getSession } from "@/lib/auth/server";
import { readAuthEnvironment } from "@/lib/auth/config";
import { readJsonBody, RequestBodyError } from "@/lib/http/json-body";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { changeWeddingLifecycle, WeddingLifecycleError } from "@/modules/weddings/lifecycle";

export async function handleWeddingLifecycle(request: Request, id: string, restore = false) {
  try {
    const session = await getSession(request.headers);
    if (!session) return apiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    const config = readAuthEnvironment();
    if (!config) return apiError(503, "DEPENDENCY_UNAVAILABLE", "Wedding changes are temporarily unavailable.");
    if (request.headers.get("origin") !== new URL(config.BETTER_AUTH_URL).origin) return apiError(403, "INVALID_ORIGIN", "Open the form from this website and try again.");
    const input = z.strictObject({ confirmationSlug: z.string().min(3).max(80) }).parse(await readJsonBody(request));
    return apiSuccess(await changeWeddingLifecycle(id, session.user.id, input.confirmationSlug, restore));
  } catch (error) {
    if (error instanceof WeddingLifecycleError || error instanceof RequestBodyError) return apiError(error.status, error.code, error.message);
    if (error instanceof ZodError) return apiError(422, "VALIDATION_FAILED", "Enter the wedding website address to confirm.");
    return apiError(503, "DEPENDENCY_UNAVAILABLE", "The wedding could not be changed. Please try again.");
  }
}
