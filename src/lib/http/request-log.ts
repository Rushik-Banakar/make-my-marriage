import "server-only";
import { after } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function withRequestLog(request: Request, route: string, work: () => Promise<Response>) {
  const start = performance.now();
  const requestId = crypto.randomUUID();
  let status = 500;
  let response: Response | undefined;
  try {
    response = await work();
    status = response.status;
    response.headers.set("X-Request-Id", response.headers.get("X-Request-Id") ?? requestId);
    return response;
  } finally {
    const record = { requestId: response?.headers.get("X-Request-Id") ?? requestId,
      route, method: request.method, status, durationMs: Math.round(performance.now() - start), occurredAt: new Date() };
    // Fixed route families only: never log URLs, query strings, headers or bodies.
    console.info(JSON.stringify({ event: "http.request", ...record }));
    after(async () => {
      try {
        const db = await getDatabase();
        await db.collection("requestLogs").insertOne(record);
      } catch {
        console.error(JSON.stringify({ event: "request_log.unavailable", requestId: record.requestId }));
      }
    });
  }
}
