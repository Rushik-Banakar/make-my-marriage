# Create a Wedding

## Stitch reference

- Project: [Make My Marriage](https://stitch.google.com/projects/17422732686462823613).
- Screen: **Make My Marriage — Create Wedding & Onboarding (Desktop)** (`e125743f9bbe48e0bd7d9abb2b1c1f32`).
- Retrieved HTML: [create-wedding-stitch.html](design/create-wedding-stitch.html). This is a design reference, not a page served by the application; its CDN scripts and sample data are not used in the feature.
- The existing screen illustrates Celebrations within a five-step onboarding flow. This increment uses the same visual layout for the previously agreed initial creation scope: Couple Details, Wedding Details, Review & Create. Ceremonies and co-owner invitation controls are reserved for their working backend increments. Fake guest counts, verified venues, sample timelines, and publishing promises are omitted.

## Current flow and contract

Sign in → My Weddings → Create a wedding → couple names and creator seat → wedding date, city/location, optional title and description, IANA timezone and unique slug → review/edit → create a private draft → protected workspace summary. Location may be left blank while plans are undecided. My Weddings allows opening any active membership's workspace. Refresh before creation discards unsaved form inputs; the UI states that inputs are saved when the wedding is created.

Wedding title and description are optional free-text fields. Name-based suggestions and hashtags were removed at the user’s request on 24 November 2026. Review, live preview and the saved private workspace show the entered details. The wedding website address reserves a unique URL name (slug) for future publication; it does not publish a site or change the private workspace URL.

`POST /api/v1/weddings` accepts only `brideName`, `groomName`, UTC `startAt`, `timezone` (default `Asia/Kolkata`), `slug`, `initialOwnerSeat` (`bride` or `groom`), and the optional string fields `location` (200 characters), `title` (160) and `description` (2,000). Empty optional strings are omitted from storage. Name limits are 100 characters, slug is 3–60 lowercase ASCII letters/numbers separated by single hyphens, request body is at most 16 KiB. Slugs normalize to lowercase. The browser's date-only input is anchored at local noon in the wedding timezone; exact ceremony times are deferred to event setup.

This additive contract extension was requested on 24 November 2026. These three optional fields are stored on `weddings` and returned only in the membership-protected detail response. Existing weddings and callers without these fields continue to work. It extends the minimal example in API Design §6.1 and the weddings entity in Database Design §5.01; publication behavior remains unchanged.

Creation requires a verified server session and an Origin matching `BETTER_AUTH_URL`; JSON callers must send that origin too. The API rejects caller-supplied identities and roles, returns 201 plus Location on success, 409 `SLUG_TAKEN` for a slug collision, and private uncached responses. Unknown or inaccessible wedding IDs return 404 from the detail API. Actual mutation access is intended for the private functional test environment until public release checks are complete.

MongoDB must support transactions (Atlas or local replica set). Creation inserts the wedding and its Admin membership, unpublished site, zero budget, simulated free plan and storage counters together with an audit event. The plan's media limits stay zero pending media implementation; it does not enable payments or uploads. Run `npm run db:setup` with the database setup account before enabling wedding creation or running the live integration test. The setup command can be rerun safely. The wedding route checks the unique slug index before writing and does not create indexes. Existing slugs are preserved.

## Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. This machine's default Turbopack build currently fails in its CSS worker; the supported fallback is `npm run build -- --webpack`.

The live database test is opt-in. It loads the ignored `.env.local`, creates uniquely named synthetic fixtures using internal services, checks full initialization, concurrent slug uniqueness and account isolation, and removes only its own records. Run on a dedicated development database:

```powershell
$env:RUN_DATABASE_TESTS = 'true'
npx vitest run tests/wedding-database.integration.test.ts
Remove-Item Env:RUN_DATABASE_TESTS
```

Before release, verify hosted account isolation/revocation, enforce appropriate mutation abuse limits, and close the documented session and email-delivery issues. Cover uploads, co-owner invitations, ceremonies, editing and publishing remain future increments.
