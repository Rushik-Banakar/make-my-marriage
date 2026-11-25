import { ZodError } from "zod";
import { getSession } from "@/lib/auth/server";
import { readAuthEnvironment } from "@/lib/auth/config";
import { withRequestLog } from "@/lib/http/request-log";
import { apiError, apiSuccess } from "@/lib/http/responses";
import { readJsonBody, RequestBodyError } from "@/lib/http/json-body";
import { EventError, readEvents, saveEvent } from "@/modules/planning/events";

export type EventContext = { params: Promise<{ weddingId: string; eventId?: string }> };
export function eventRequest(request: Request, context: EventContext, mode: "events" | "itinerary" | "cancel" = "events") {
  return withRequestLog(request, "planning." + mode, async () => {
    try {
      const session = await getSession(request.headers);
      if (!session) return apiError(401, "AUTH_REQUIRED", "Sign in to see the itinerary.");
      const { weddingId, eventId } = await context.params;
      if (request.method === "GET") {
        const data = await readEvents(weddingId, session.user.id, { eventId, scheduled: mode === "itinerary" });
        return apiSuccess(eventId ? data[0] : data);
      }
      const config = readAuthEnvironment();
      if (!config || request.headers.get("origin") !== new URL(config.BETTER_AUTH_URL).origin)
        return apiError(403, "INVALID_ORIGIN", "Open this form from the wedding workspace.");
      const input = mode === "cancel" ? { status: "cancelled" } : await readJsonBody(request);
      return apiSuccess(await saveEvent(weddingId, session.user.id, input, eventId), undefined, { status: eventId ? 200 : 201 });
    } catch (e) {
      if (e instanceof ZodError) return apiError(422, "VALIDATION_FAILED", e.issues[0].message);
      if (e instanceof EventError || e instanceof RequestBodyError) return apiError(e.status, "EVENT_ERROR", e.message);
      return apiError(503, "DEPENDENCY_UNAVAILABLE", "The ceremony schedule is temporarily unavailable.");
    }
  });
}
