import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/server";
import { readAuthEnvironment } from "@/lib/auth/config";
import { apiError } from "@/lib/http/responses";

export const runtime = "nodejs";

async function handle(request: Request) {
  if (!readAuthEnvironment())
    return apiError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Sign-in is temporarily unavailable.",
    );
  try {
    const handlers = toNextJsHandler(getAuth());
    const response = await (request.method === "GET"
      ? handlers.GET(request)
      : handlers.POST(request));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return apiError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "Sign-in is temporarily unavailable. Please try again.",
    );
  }
}

export const GET = handle;
export const POST = handle;
