import { withRequestLog } from "@/lib/http/request-log";
import { getSession } from "@/lib/auth/server";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { createWedding, listMyWeddings } from "@/modules/weddings/service";
import { readAuthEnvironment } from "@/lib/auth/config";
import { readJsonBody, RequestBodyError } from "@/lib/http/json-body";
import { ZodError } from "zod";
import { MongoServerError } from "mongodb";

export const runtime = "nodejs";

async function get(request: Request) {
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

async function post(request: Request) {
  try {
    const session = await getSession(request.headers);
    if (!session) return apiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
    const config = readAuthEnvironment();
    if (!config) return apiError(503, "DEPENDENCY_UNAVAILABLE", "Wedding creation is temporarily unavailable.");
    if (request.headers.get("origin") !== new URL(config.BETTER_AUTH_URL).origin) {
      return apiError(403, "INVALID_ORIGIN", "Open the form from this website and try again.");
    }
    const created = await createWedding(await readJsonBody(request), session.user.id);
    return apiSuccess(created, undefined, { status: 201, location: `/api/v1/weddings/${created.id}` });
  } catch (error) {
    if (error instanceof RequestBodyError) return apiError(error.status, error.code, error.message);
    if (error instanceof ZodError) return apiError(422, "VALIDATION_FAILED", error.issues[0]?.message ?? "Check your wedding details.");
    if (error instanceof MongoServerError && error.code === 11000 && error.keyPattern?.slug) {
      return apiError(409, "SLUG_TAKEN", "That wedding address is already taken. Choose another.");
    }
    return apiError(503, "DEPENDENCY_UNAVAILABLE", "Your wedding could not be saved. Please try again shortly.");
  }
}

export async function GET(request: Request) {
  return withRequestLog(request, "weddings.list", () => get(request));
}

export async function POST(request: Request) {
  return withRequestLog(request, "weddings.create", () => post(request));
}
