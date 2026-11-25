export function apiSuccess(data: unknown, requestId = crypto.randomUUID(), options: { status?: number; location?: string } = {}) {
  return Response.json(
    { data, meta: { requestId } },
    {
      status: options.status ?? 200,
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId,
        ...(options.location ? { Location: options.location } : {}) },
    },
  );
}

export function apiError(
  status: number,
  code: string,
  message: string,
  requestId = crypto.randomUUID(),
) {
  return Response.json(
    { error: { code, message }, meta: { requestId } },
    {
      status,
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    },
  );
}
