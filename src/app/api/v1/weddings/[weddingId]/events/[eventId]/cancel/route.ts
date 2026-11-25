import { eventRequest, type EventContext } from "@/modules/planning/events-http";
export function POST(request: Request, context: EventContext) {
  return eventRequest(request, context, "cancel");
}
