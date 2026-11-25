import { eventRequest, type EventContext } from "@/modules/planning/events-http";
export function GET(request: Request, context: EventContext) {
  return eventRequest(request, context, "itinerary");
}
