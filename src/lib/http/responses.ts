export function apiSuccess(data: unknown, requestId = crypto.randomUUID()) {
  return Response.json(
    { data, meta: { requestId } },
    {
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
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
