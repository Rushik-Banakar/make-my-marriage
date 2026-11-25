export class RequestBodyError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function readJsonBody(request: Request, maxBytes = 16384): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestBodyError(415, "UNSUPPORTED_MEDIA_TYPE", "Send application/json.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400, "INVALID_REQUEST", "Send a JSON object.");
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, "PAYLOAD_TOO_LARGE", "The request is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); }
  catch { throw new RequestBodyError(400, "INVALID_REQUEST", "Send valid JSON."); }
}
