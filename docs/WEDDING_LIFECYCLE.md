# Wedding deletion, recovery and logging

Implemented 24–25 November 2026 at the user's request. This extends the creation contract in [CREATE_WEDDING.md](CREATE_WEDDING.md). PRD ownership principles and FR-17 require additional confirmation and a recorded, recoverable deletion process; Database Design specifies soft deletion where history is needed.

## Delete and restore

- Owners see **Delete wedding** on their My Weddings card and inside the workspace. The confirmation explains retention and requires the exact wedding website address. Cancel makes no change.
- `DELETE /api/v1/weddings/{weddingId}` accepts only `{ "confirmationSlug": "the-wedding-address" }`. It requires a current server session, matching Origin, JSON, a valid ID and an active Admin membership. An outsider or Manager receives 404; invalid confirmation returns 422. Multiple active owners return 409 until a shared-consent workflow is implemented.
- A MongoDB transaction sets `deletedAt` and `deletedByAuthUserId` on `weddings`, unpublishes its site and appends `wedding.deleted` to `auditEvents`. Failure to write the audit event rolls the transaction back. No business records or media are physically erased.
- Deleted weddings are excluded from membership lists and protected detail reads. Deletion preserves membership records so recovery can re-establish the same workspace; the deleted parent prevents current detail access.
- `/weddings/deleted` lists only weddings deleted by the signed-in user who still has an active Admin membership. The deleting Admin can restore using the same typed confirmation.
- `POST /api/v1/weddings/{weddingId}/restore` accepts the same body, clears deletion markers and appends `wedding.restored` atomically. The original status and contents are preserved. Restoration never republishes a website.
- The slug remains reserved during deletion. There is no automatic purge or expiry in this development increment. Permanent erasure, retention limits, shared owner consent and media cleanup need a separate approved workflow before real-user launch.

All future wedding modules must check the parent wedding's deletion state through the central server authorization layer before returning or changing child records.

## Logging

Application API handlers and Better Auth GET/POST handlers emit structured server request metadata and use Next.js `after()` to persist it after sending the response in `requestLogs`: server-generated request ID, fixed route family, method, status, elapsed milliseconds and timestamp. The TTL index installed by `npm run db:setup` expires request logs after approximately 30 days. MongoDB TTL cleanup is asynchronous.

`auditEvents` retains wedding creation, deletion and restoration events with wedding ID, trusted actor ID, action, timestamp and outcome. These audit events are part of the business transaction and do not use the request-log TTL.

Passwords, OTPs, cookies, bearer tokens, raw URLs/query strings, request bodies and connection strings are excluded from these logs. This does not collect browser keystrokes or every client-side interaction. If request-log persistence fails, a safe server diagnostic is emitted and the original API response is preserved. Durable logging cannot be guaranteed while MongoDB is unavailable. Existing framework/development logs remain separate.

## Compass connection

The site uses the Atlas connection in ignored `.env.local` and selects `DATABASE_NAME`. The current development database is `make_my_marriage_dev`. Compass originally had only a separate `localhost:27017` connection; a connection named **Make My Marriage — site database** was opened against the site's Atlas URI. Database credentials were kept out of source control and diagnostic output.

Compass and the site are separate clients of the same database. A change made by the site appears in Compass after refreshing its view. New network connections require the current public IP to be permitted in Atlas Network Access; a previously established connection is not proof that a fresh connection will succeed from a changed network. TLS verification must remain enabled.
