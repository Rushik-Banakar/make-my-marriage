import { handleWeddingLifecycle } from "@/modules/weddings/lifecycle-http";
import { withRequestLog } from "@/lib/http/request-log";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ weddingId: string }> }) {
  return withRequestLog(request, "weddings.restore", async () => handleWeddingLifecycle(request, (await params).weddingId, true));
}
