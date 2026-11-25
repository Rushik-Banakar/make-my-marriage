# Make My Marriage project status

Last updated: 25 November 2026

This file tracks delivered features and the project's current state. Read it before starting feature work and update it when a major feature is delivered or its status materially changes.

## Current state

The application scaffold and responsive public homepage are complete within their stated scope. The homepage shows illustrative, read-only wedding data and offers separate Sign up and Log in actions. Local authentication supports verified email/password registration, password or Google login, and email-code password recovery. Signed-in users can create a private draft wedding, view active memberships and open a protected summary. Single-owner weddings support confirmed, recoverable deletion and restoration. API request metadata and wedding lifecycle audit events are persisted in MongoDB. The remaining onboarding and wedding workflows are not yet implemented.

The latest committed feature is `3818862` (authentication database connection recovery) on `dev`, following `50de657` (registration and existing-account feedback). Both are pushed to `origin/dev`; `6be1986` records the agreed feature workflow. The Stitch-based wedding creation increment below is in the working tree. Resend confirmed delivery of a local reset code to the configured test inbox. Hosted registration and recovery, Google/password account linking, and live session expiry checks remain unverified. Authentication remains in progress.

## Scope references

These four documents govern product requirements and implementation contracts. This status file records progress; it does not expand or replace their scope.

- [Product requirements](PRD.docx)
- [System design](System_Design.docx)
- [Database design](Database_Design.docx)
- [API design](API_Design.docx)

Stitch provides the visual reference. Where its mockups suggest features beyond the documented MVP, the four design documents take precedence. Mobile mockups are adapted for responsive browser layouts within the same web application.

## Delivered milestones

### 1. Application scaffold

- **Status:** Complete — application foundation only.
- **Progress recorded:** 19 November 2026; scaffold verified locally on 18 November 2026.
- **Commit:** `9f94d7f` — Scaffold Make My Marriage application.
- **Delivered:** A single Next.js App Router application with TypeScript, Tailwind CSS, and shadcn/ui setup; public homepage route; repository guidance, design documents, and development/check scripts.
- **Verified:** The development server started successfully and the original scaffold homepage returned HTTP 200. Lint and type checking passed. The later homepage production build also verified the application foundation.
- **Boundary:** The scaffold establishes the application structure, not implemented authentication, business modules, database persistence, or tenant authorization.

### 2. Public homepage

- **Status:** Complete — public presentation and sample preview only.
- **Progress recorded:** 19 November 2026.
- **Commit:** `9243f0e` — Build responsive public homepage from Stitch design.
- **Visual reference:** Stitch project `17422732686462823613`, desktop landing-page screen `ca5e10d011f94f77929eb2dc9deebe9a`.
- **Delivered:**
  - Stitch-inspired section layout, forest-green and mint palette, gold accents, and locally hosted Newsreader and Manrope fonts.
  - Hero, wedding dashboard preview, feature explanations, invitation example, planning steps, role descriptions, FAQs, closing section, and footer.
  - Responsive desktop, tablet, and phone-browser layouts.
  - Working Overview, Tasks, and Expenses preview controls using illustrative, read-only data.
  - Smooth in-page navigation with reduced-motion support, collapsible mobile navigation, expandable FAQs, and keyboard focus styling.
  - Separate Sign up and Log in actions in the header and sample-workspace links in the hero.
  - MVP-aligned wording for couple co-ownership, organizer permissions, recorded INR expenses, per-person/event RSVP, and manual invitation sharing.
- **Verified:** `npm run lint`, `npm run typecheck`, and `npm run build` passed. The homepage returned HTTP 200. Browser checks covered preview controls, FAQs, section links, mobile navigation, and responsive widths; no console errors or broken section links were found. Smooth scrolling and section landing positions were checked after the navigation changes. A separate read-only review found no actionable issues.
- **Boundary:** The homepage previews are illustrative and read-only. Account access is documented below. Wedding creation, invitation delivery, RSVP submission, expense exports, and private gallery access remain future work.

### 3. Google sign-in and protected My Weddings entry

- **Status:** In progress — implementation, local checks, and the core live Google/MongoDB journey verified; session-cookie refresh fix and additional expiry/multi-account isolation checks pending.
- **Progress recorded:** 19 November 2026.
- **Commits:** `b3a100a` — Add Google authentication and protected My Weddings; `50de657` — registration and existing-account feedback; `3818862` — database connection recovery.
- **Visual references:** Stitch Login & Sign Up desktop screen `2a4afe4273454d29b4ac5ad7a9917447` and My Weddings desktop screen `dbc8929e4a604fa2be2ca57ed9430161` in the existing project.
- **Delivered:**
  - Responsive `/login` with Google sign-in, loading/error feedback, and a disabled sign-in state when configuration is missing. Homepage navigation now links to sign-in.
  - Lazy server-side Better Auth configuration using the pinned MongoDB adapter, an explicit trusted origin, database-backed authentication rate limits, and uncached provider session validation.
  - Shared MongoDB connection pool, environment validation, and documented configuration in `.env.example` and [AUTH_SETUP.md](AUTH_SETUP.md).
  - Protected `/weddings` with current-user membership listing, a new-account empty state, sign-out controls, and loading/error boundaries.
  - Better Auth GET/POST handlers at `/api/auth/[...all]`, plus protected read-only `/api/v1/me` and `/api/v1/weddings` endpoints with response envelopes and `no-store` headers.
  - Wedding queries start from the current user's active `weddingMembers` records, preserve the adapter-returned string user ID, and return only wedding summary fields. They do not grant ownership from sign-in.
- **Verified:** 21 automated tests passed for configuration, mocked session-provider delegation without cookie caching, API authentication boundaries, session-derived query scope, safe summary serialization, and protected-page/empty-state behavior. Lint, type checking, and production build passed. Browser checks verified desktop and narrow phone login layouts (320px and 390px), generic error feedback, missing-configuration behavior, homepage sign-in navigation, and anonymous `/weddings` redirection to login; no browser console errors were observed. Actual unauthenticated account API requests returned 401 with `no-store`; the unconfigured auth provider route returned 503.
- **Live verification:** Development settings were copied from `.env.example` into ignored `.env.local`, and the tracked example was restored to safe placeholders. After restarting the server, Atlas connectivity and the unique indexes on user email, session token, and rate-limit key were confirmed. The provider session endpoint returned HTTP 200 with null for an anonymous request. The enabled Google button opened the Google sign-in page. The user completed Google login in Edge; My Weddings showed the signed-in identity and an empty membership list. Reopening the page preserved the session, and an authenticated `/api/v1/weddings` request returned an empty data list. Sign-out returned to login, and a subsequent visit to `/weddings` redirected to login.
- **Verification limit:** Explicit expiry, administrative revocation independent of sign-out, multi-account isolation, and memberships for existing weddings remain unverified against the live database. Automated tests cover mocked session handling and query scope but do not replace these checks. No real wedding data was created during this verification.
- **Review:** A read-only subagent review against `origin/dev` at `f8497da` covered staged, unstaged, and untracked changes. It reported one P2 issue in `src/lib/auth/server.ts`, `getSession`: server-side session reads can extend the database expiry without delivering the refreshed cookie to the browser. An active user can therefore be signed out when the original seven-day browser cookie expires. No additional actionable findings were reported. The current code still contains this issue; no fix or re-review has been completed.
- **Follow-up:** Implement a browser-capable session refresh path and propagate refresh cookies from application API responses, then test renewal across the update interval. Finish the remaining session and account-isolation checks in [AUTH_SETUP.md](AUTH_SETUP.md) before marking this milestone complete. Email OTP, profile editing, wedding creation, invitation acceptance, and dashboard entry are separate increments.

#### Single Google account-entry refinement (superseded)

- **Status:** Implemented locally; full provider round-trip for the revised registration flow is pending.
- **Progress recorded:** 19 November 2026.
- **Delivered:** One homepage account action, Get started, opens `/signup`. The account page contains one Continue with Google button for both new and returning users. The separate Sign in/Create account switching links were removed at the user's request, superseding the earlier two-page refinement. `/login` remains a compatibility redirect to `/signup`; sign-out, protected-page redirects, and provider errors use the single account page. Explanatory copy is kept minimal.
- **Behavior:** The sole Google action explicitly passes `requestSignUp: true`, allowing a new account to be created after Google verification while existing accounts sign in normally. No wedding ownership is granted by authentication. Successful authentication leads to My Weddings.
- **Verified:** 30 automated tests passed, including single-button rendering without circular account links, legacy-login redirects with a safe error flag, protected-page redirects, Google registration intent, provider configuration, and rejection of missing/error/unexpected authorization URLs. Browser checks verified Get started opens `/signup`, the account card has no links to `/login` or itself, and `/login` redirects to `/signup`. The earlier Google-button browser check reached Google's account screen. Lint, type checking, and production build passed for the refinement.
- **Navigation:** The client explicitly navigates to the Google URL returned by Better Auth with SDK automatic redirects disabled. Errors return to the same account page. Google authentication uses the current browser tab rather than a popup.
- **Limit:** The simplified entry page and redirect behavior were tested; a fresh account completing the revised provider callback has not been observed. The live checklist in [AUTH_SETUP.md](AUTH_SETUP.md) covers new and returning accounts using the same action. The earlier session-cookie refresh review finding remains unresolved.

#### Separate Google signup and login (superseded)

- **Status:** Implemented locally. Live callback verification remains pending.
- **Progress recorded:** 21 November 2026.
- **Delivered:** One Sign up and one Log in action on the homepage, with a purpose-specific Google button on each account page. Login uses the existing Google identity and disables implicit signup. Signup allows new accounts. Both require a valid email marked verified by Google. Implicit linking by email is disabled. Signed-out visitors to My Weddings and users signing out return to login.
- **Verified:** Lint, type checking, production build, and 32 automated tests passed. Local HTTP checks confirmed both homepage links, both account pages, successful Google authorization URL responses for both paths, and the anonymous My Weddings redirect to login.
- **Remaining:** Complete the revised Google callbacks with a new and a returning test account, including rejection of an unregistered Google identity on the login path. The session-cookie refresh issue and live expiry and account-isolation checks remain open.

#### Email registration and password or Google login

- **Status:** Implemented locally, with hosted verification pending.
- **Progress recorded:** 21 November 2026.
- **Delivered:** Registration collects a name, email, contact phone with country code, and password. Better Auth requires mailbox verification before issuing a password session. Login accepts the registered password or the matching verified Gmail or Google Workspace identity. Existing Google-linked users can continue to log in. Phone details are omitted from authentication responses.
- **Verified:** An isolated Better Auth integration test exercised registration validation, verification, password rejection, and verified session issuance using a memory database and mocked email delivery. Local HTTP smoke checks verified both forms, Google redirect initiation, and delivery to the local Mailpit inbox.
- **Remaining:** Configure a sender for real inbox delivery before enabling hosted registration, and verify the live Google callback for newly registered and existing users. Phone ownership verification and the existing session-renewal follow-up remain open.

#### Registration validation and password recovery

- **Status:** Implemented locally. Hosted email delivery remains pending.
- **Progress recorded:** 21 November 2026.
- **Delivered:** Separate country code and phone fields are combined for storage. Signup checks email syntax on the client and server, and a new password account needs mailbox verification. The registered mailbox receives an already-member notice for a verified duplicate. Password recovery verifies the six-digit email code before opening the password form and checks it again during reset. Codes expire after five minutes, allow three verification attempts, and are stored hashed. Reset revokes old sessions.
- **Verified:** Automated checks covered malformed email rejection, duplicate notification, the same public response for known and unknown reset emails, invalid and reused code rejection, successful code checking before password replacement, and session revocation. Local smoke checks confirmed the pages no longer link to the test inbox.
- **Local delivery:** Configured a sending-only Resend key in the ignored local environment with Mailpit disabled. The local reset API accepted a request and Resend reported delivery to the authorized test inbox.
- **Password length:** Removed the 12-character minimum from signup and reset. Empty passwords are still rejected and the 128-character maximum remains. The integration test signs up with a one-character password and resets it to a different one-character password.
- **Remaining:** Verify the user-completed password change after real email delivery. Hosted delivery to general recipients still requires a verified sender domain.

#### Existing-account signup feedback

- **Status:** Complete — local duplicate-signup feedback; overall authentication remains in progress.
- **Progress recorded:** 22 November 2026.
- **Delivered:** Signup now rejects an existing email with an explicit already-exists result and shows “An account already exists with this email. Please log in.” with a login link. This applies to verified and unverified accounts and compares email addresses without case sensitivity. It replaces the previous generic check-email response and already-member notification email. New registrations retain email verification. Password recovery continues to use uniform responses for known and unknown addresses.
- **Verification:** All 32 tests passed. The Better Auth integration test covers new registration, verified and unverified duplicate rejection, uppercase duplicate detection, no duplicate session or notification email, and the existing login/recovery flow. Local browser verification confirmed the duplicate message and working login link. Lint, type checking, and the production build passed.
- **Boundary:** The requested signup response intentionally distinguishes existing from new email addresses. Existing mailbox-verification requirements still apply; this change does not sign anyone in.

#### Database connection recovery — 24 November 2026

- **Status:** Complete for the observed local database-access failure and failed-initialization recovery; overall authentication remains in progress.
- **Commit:** `3818862` — Recover authentication after database connection failures; pushed to `origin/dev`.
- **Diagnosis:** Local logs showed MongoDB TLS handshake failures followed by a permanently closed topology. Atlas showed that the current public IP was missing while the two existing IP entries were active. A separate encrypted database connection check reproduced the TLS failure. This is a network-access dependency failure, not a 24-hour authentication allowance.
- **Delivered:** Explicit shared database connection initialization before auth adapter construction, failed-client cleanup, retryable auth initialization on later requests, removal of the driver's ignored `timeoutMS` setting, and a secret-safe `npm run auth:check` diagnostic. No paid service added; TLS certificate validation remains enabled.
- **Verification:** 34 automated tests passed, including failed connection cleanup, concurrent initialization sharing, recovery on a later request, and auth initialization retry. Lint and type checking passed. The default production build hit a Turbopack CSS-worker crash both inside and outside the sandbox; `npm run build -- --webpack` passed. After explicit user approval, the current public IP was added as a non-temporary single-address Atlas rule and showed Active. The encrypted database connection and ping passed. Browser checks confirmed password login with the existing synthetic account, refresh persistence, sign-out, enabled signup, duplicate-account feedback and its login link, and the existing real Google account completing login to My Weddings. Both browser test sessions were signed out. No new accounts were created in this pass. See [login evidence](qa-evidence/auth-restored-2026-11-24.jpg).
- **Review:** A separate read-only reviewer checked staged, unstaged, and untracked changes against `origin/dev` at `50de657d97ea12c15e98ad35703f47f7d7becff8` on 24 November 2026. No actionable regressions were found and `git diff --check` passed. This review did not rerun tests or builds and does not close the earlier authentication findings.
- **Remaining:** Non-temporary IP rules do not cover future ISP/VPN IP changes; a stable network or a local replica set is required to avoid this dependency. General-recipient email delivery, session renewal, and the other existing authentication follow-ups remain open. Newly delivered verification/reset emails were not tested in this pass. No lifetime availability or permanent free-tier guarantee is made.

#### Current code review

- **Reviewed:** 21 November 2026. Review covered tracked changes and new authentication files in the working tree.
- **P1, public release:** Signup and recovery accept one-character passwords. Local tests intentionally exercise this policy. Require a stronger minimum before hosted password authentication and plan recovery for accounts already using very short passwords.
- **P2, session renewal:** Protected pages and application API routes use a session read that can extend expiry in MongoDB and discard the refreshed cookie header. Add a browser-facing renewal path and verify renewal across the update interval.
- **P2, recovery delivery:** Reset requests are rate-limited by source IP and route. Add a recipient-level cooldown so requests from multiple sources cannot flood one inbox or supersede a code while the member is entering it.
- **P2, hosted sender configuration:** The test sender satisfies the app's delivery configuration check even on the hosted runtime. It can send only to the Resend account inbox. Validate the hosted sender configuration and verify delivery to a separate test address before publishing signup and reset.

### Local QA pass — 21 November 2026

- **Status:** Authentication remains in progress; local verification coverage expanded. No application fixes were made during this testing pass.
- **Verified:** Browser registration and email-link verification using temporary synthetic local email capture, verified password login with uppercase email, duplicate-member notification, existing Google login and cancellation/retry, My Weddings empty state, reload persistence, sign-out and protected-page redirects. Live API checks covered anonymous/forged-cookie rejection, invalid-origin rejection, registration validation, code replacement/reuse, password replacement on a disposable account, and revocation of a session issued before that reset. A fresh reset message was confirmed in the connected Gmail inbox.
- **Finding:** New registration using a Gmail alias under the original Resend configuration showed the check-email notice, but verification delivery failed on the server and no Gmail message was found. General-recipient delivery remains blocked by sender configuration. Synthetic capture verifies application flow, not external delivery.
- **Checks:** 32 tests passed; lint, type checking, and production build passed. Original local environment restored byte-for-byte, temporary email sink stopped, and browser sessions signed out. Two test registrations remain in the development database with no wedding memberships.
- **Limits:** Hosted flows, Google/password linking, timed expiry, independent OTP attempt exhaustion, session renewal, populated account isolation, manual reset confirmation, and exact 320/390-pixel coverage remain unverified in this pass. See [the detailed QA report](QA_REPORT_2026-11-21.md) for case-level outcomes, screenshot evidence, release findings, and remaining coverage.

### 4. Create a Wedding — initial private draft

- **Status:** Complete for locally verified initial draft creation; the broader wedding onboarding milestone remains in progress. Changes are uncommitted.
- **Progress recorded:** 24 November 2026.
- **Design:** User authorized implementation after confirming the existing Stitch UI. Retrieved **Create Wedding & Onboarding (Desktop)**, screen `e125743f9bbe48e0bd7d9abb2b1c1f32` in project `17422732686462823613`, including HTML and screenshot through the Stitch connector. The screen depicts the Celebrations step of a larger wizard. Its stepper, two-column form/live preview layout, Newsreader/Manrope typography, mint/forest palette and gold accents were adapted to Couple Details → Wedding Details → Review & Create. See [source and scope notes](CREATE_WEDDING.md) and [retrieved HTML](design/create-wedding-stitch.html).
- **Delivered:**
  - My Weddings links to protected `/weddings/new`. The three-step form retains inputs when navigating backward, generates an editable unique slug, validates names/date/timezone/role, previews actual inputs, and provides review/edit and duplicate-address recovery.
  - `POST /api/v1/weddings` derives the creator from the validated session, enforces origin/JSON/body-size checks and strict field validation, and returns a private `201` response with Location. Unknown ownership/role fields are rejected.
  - One MongoDB transaction creates the wedding, initial active Admin seat, unpublished website, zero INR budget, simulated free plan, zero storage counters and a creation audit event. Indexes enforce unique slugs, membership, owner seats and one settings record per wedding. Failed initialization can retry; there is no partial-write fallback for standalone MongoDB.
  - Membership-scoped My Weddings listing, protected `/weddings/[weddingId]`, and `GET /api/v1/weddings/[weddingId]`. Non-members receive no private summary; the API conceals the resource with 404. Dates display in the saved wedding timezone.
- **Verification:** 45 standard tests passed; the opt-in MongoDB integration test passed separately. Tests cover invalid/privileged fields, origin and authentication boundaries, JSON/body limits, timezone and daylight-saving dates, transaction rollback under a simulated later-write failure, concurrent live slug uniqueness, the complete persisted record bundle, and owner/outsider isolation using synthetic identities. The live integration test cleaned up its records. Lint and type checking passed. `npm run build` reproduced the known Turbopack CSS-worker crash; `npm run build -- --webpack` passed. Browser checks verified step transitions, input retention through review edits, live preview, invalid-timezone feedback, saving, refresh persistence and the membership card in My Weddings. See [UI evidence](qa-evidence/create-wedding-stitch-2026-11-24.png).
- **Additional browser checks:** Duplicate-address submission returned to Wedding Details with all entries preserved and clear conflict feedback. The disposable browser-created wedding and related records were removed after verifying its exact ID, slug and QA-account ownership; the QA account returned to zero weddings. Sign-out completed, and signed-out `/weddings/new` redirected to login. Desktop visual layout was inspected; exact mobile breakpoint verification remains a follow-up.
- **Boundary at initial delivery:** The initial form implemented the minimal documented create-wedding API fields, not all of FR-02. Location was added in the refinement below. Co-owner invitations/acceptance, cover media, ceremonies, full dashboard and public website publishing remain follow-ups. Media quotas initialize to zero until uploads and free limits are implemented; no paid billing is enabled. Hosted testing, broader role/revocation scenarios and mutation abuse controls still need release verification. The existing authentication/session/email limitations remain open.

#### Wedding onboarding details — 24 November 2026

- **Status:** Complete for locally verified details capture; hosted verification remains open. Uncommitted.
- **Delivered:** Retained Couple Details → Wedding Details → Review & Create. Wedding Details now collects date, city/location, optional wedding title and description, then timezone and website address. Location may be left blank while plans are undecided. The user subsequently requested removal of the name-based suggestions and hashtag field; both were removed from the form, preview, review, validation, writes and detail response. Review and private workspace show the saved details. The website address label and help explain that it reserves a unique URL name for a future unpublished website.
- **Contract:** Added optional `location`, `title` and `description` fields to validated creation, transactional persistence and membership-protected detail reads. Existing records and callers remain compatible. Increased the JSON limit to 16 KiB for descriptions and Unicode text; documented bounds and the additive contract extension in [CREATE_WEDDING.md](CREATE_WEDDING.md).
- **Fix:** Trim timezone input consistently during conversion and preview formatting so trailing whitespace cannot crash the unsaved form.
- **Verification:** Earlier refinement: 48 tests, lint, type checking and Webpack build passed; the default build stalled and was stopped. After removing suggestions/hashtags: 47 tests passed, including rejection of the removed API field, remaining optional-field bounds/normalization, API forwarding and protected detail serialization, transaction persistence, and timezone whitespace. Lint and type checking passed. The Webpack build passed on retry after an initial EPERM creating a generated output directory; the directory was confirmed writable. Browser and live-database verification remain pending. The opt-in live database test was skipped.
- **Follow-up verification, 24–25 November:** A fresh browser account completed the simplified form with date, location, optional title and multiline description. Review edits retained inputs; invalid timezone feedback and whitespace recovery worked. The saved details survived browser refresh and deletion/restoration. See [the current QA report](QA_REPORT_2026-11-25.md).
- **Limits:** Hosted testing and the earlier milestone limitations remain open. Earlier creation screenshot evidence represents the previous form; the current QA report links updated workspace evidence.

### 5. Recoverable wedding deletion and request logging

- **Status:** Complete for the locally verified single-owner development scope. Uncommitted; broader retention, co-owner consent and production release work remain open.
- **Progress recorded:** 25 November 2026; implementation and QA began on 24 November.
- **Delivered:** Owners can delete from the wedding card or workspace using an exact-address confirmation. The transaction retains the wedding with deletion markers, unpublishes the site and appends an audit event. Deleted weddings disappear from active lists and detail access. The deleting active Admin can restore from `/weddings/deleted`; restoration preserves contents and never republishes. Managers/outsiders cannot mutate the lifecycle, and multi-owner deletion is blocked pending a shared-consent workflow. Slugs remain reserved.
- **Logging:** All implemented application API handlers and Better Auth GET/POST handlers emit safe server request metadata and persist `requestLogs` with a verified 30-day TTL. Creation/deletion/restoration append `auditEvents`. Passwords, codes, cookies, tokens, raw URLs and bodies are excluded. Logging failures preserve the application response and emit a safe console diagnostic. See [the lifecycle and logging contract](WEDDING_LIFECYCLE.md).
- **Verification:** 56 standard tests, the opt-in Atlas integration test, lint, type checking and the Webpack production build passed. Browser tests covered delete/cancel/incorrect confirmation, blocked deleted-detail access and successful restoration. Live API checks covered anonymous and cross-account access, origin checks, identity injection, typed confirmation and reserved slug collisions. A fresh synthetic customer registered, verified email using local capture, logged in, created/refreshed/deleted/restored a wedding, and logged in after a live API password reset that revoked the old session. Targeted 320px/1280px workspace checks passed. Full cases and limits are in [QA_REPORT_2026-11-25.md](QA_REPORT_2026-11-25.md).
- **Database and Compass:** Opened **Make My Marriage — site database** against the site's configured Atlas database, `make_my_marriage_dev`, and refreshed its overview so `requestLogs` appears. The user changed networks during QA; after explicit authorization, only Atlas's current single-IP rule was added. Atlas showed Active, and a fresh TLS connection and ping passed. Direct inspection verified the browser fixture's four lifecycle events and 40 safe request-log records at that point.
- **Cleanup:** Temporary loopback synthetic email capture was stopped and the site restarted with its normal saved environment. Saved Resend configuration remained present and Mailpit disabled. The temporary runner files were removed. The browser session was signed out, its viewport override reset, and signed-out `/weddings/new` redirected to login. Two synthetic QA accounts and one recoverable deleted QA wedding remain for traceability; existing user weddings were untouched.
- **Limits:** This is recoverable deletion, not permanent erasure. Purging, data retention, shared owner consent and media cleanup remain separate policy and implementation work. General-recipient delivery with the existing test sender, session renewal/expiry, Google linking, hosted testing and prior authentication findings remain open. Future public-IP changes can require another Atlas access-list update.

#### Wedding review fixes — 25 November 2026

- **Delivered:** Request-log persistence now runs after the HTTP response. The versioned `npm run db:setup` command provisions wedding constraints and the 30-day request-log TTL outside request handling. Wedding creation checks the unique slug index before writing. The form, suggestions and create API cap new slugs at 60 characters. Existing slugs remain usable for deletion and restoration.
- **Verified:** 57 standard tests passed. Database setup and the opt-in Atlas transaction, isolation, and delete/restore integration test passed. A fresh local HTTP check verified signed-out denial, password sign-in, the 60/61-character boundary, duplicate rejection, invalid delete confirmation, hidden deleted detail, restoration, and persistence of the request log correlated to the creation response. The disposable wedding was removed and the QA account signed out.
- **Open:** General-recipient signup verification still requires an authorized sender and external-inbox verification. Hosted deployment and other authentication follow-ups remain open.
- **Build checks:** Lint, type checking, and the Webpack production build passed. The default Turbopack build reproduced the existing CSS-worker failure.

## Agreed feature workflow

Confirmed by the user on 24 November 2026: identify the next feature, discuss and agree its scope and flows, create its UI design in Google Stitch, review and approve that design, then implement it in the website. Do not begin feature implementation before the planning and Stitch design steps are approved. The user subsequently authorized Create a Wedding implementation using the existing Stitch design. Apply the same workflow to the next increment, co-owner onboarding.

## Remaining work

Close the session-renewal issue and complete the account access checks. Initial wedding creation is locally verified. The next product increment is second co-owner onboarding, followed by events and the private dashboard. The design documents govern implementation scope and sequencing.

- Session-cookie refresh fix and renewal test, session-expiry and administrative revocation checks, multi-account isolation, and remaining account/profile and development-only OTP login requirements.
- Broader wedding setup (cover media), co-owner onboarding, and additional server-enforced permissions. Initial creation, location/title/description capture, membership listing and private summary access are implemented locally.
- Persisted events, itinerary, tasks, and task templates.
- Persisted budgets, expenses, reports, and authorized exports.
- Guest/family management, event-specific invitations, RSVP, and analytics.
- Wedding website editing and publication.
- Private media uploads, gallery verification, and authorized album access.
- Remaining PWA, operational, release, and hosting requirements.

## How to maintain this file

For each major feature, add a milestone with its name, status, date, delivered scope, verification evidence, and limitations or follow-up work. Include a commit reference when one exists; never invent a pending commit hash.

Use **Not started**, **In progress**, **Blocked**, or **Complete**, and qualify completion with the actual scope. If work is blocked, record the specific blocker and what is needed to resolve it. Keep this summary and the remaining-work list consistent with the milestones. Preserve earlier completed milestones and update an existing entry when refining that same feature rather than duplicating it.

Record actual checks and outcomes, including incomplete verification. Do not treat a visual mockup, sample interaction, or planned feature as a completed backend workflow. Never include credentials, private guest data, or temporary signed URLs.
