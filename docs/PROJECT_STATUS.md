# Make My Marriage project status

Last updated: 19 November 2026

This file tracks delivered features and the project's current state. Read it before starting feature work and update it when a major feature is delivered or its status materially changes.

## Current state

The application scaffold and public homepage are complete within their stated scope. The homepage is a responsive web experience with illustrative, read-only wedding data. Google authentication and the protected My Weddings entry page are implemented locally; the live Google login, persisted session, empty membership list, and sign-out journey have been verified with development credentials. Code review identified an unresolved session-cookie refresh issue, so the authentication milestone remains in progress. Additional expiry and multi-account isolation checks remain pending. Persisted wedding creation and the other business workflows remain unimplemented.

The latest committed feature is `9243f0e` (homepage); the status-tracking documentation was committed as `f8497da` on `dev` and pushed to `origin/dev`. Authentication changes described below are not committed yet. Deployment to a hosted environment has not been verified.

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
  - Reduced repeated workspace calls to action: navigation and hero entry points only.
  - MVP-aligned wording for couple co-ownership, organizer permissions, recorded INR expenses, per-person/event RSVP, and manual invitation sharing.
- **Verified:** `npm run lint`, `npm run typecheck`, and `npm run build` passed. The homepage returned HTTP 200. Browser checks covered preview controls, FAQs, section links, mobile navigation, and responsive widths; no console errors or broken section links were found. Smooth scrolling and section landing positions were checked after the navigation changes. A separate read-only review found no actionable issues.
- **Boundary:** This is not a functional wedding-management dashboard. The previews do not persist changes or enforce backend permissions. Sign-in, wedding creation, invitation delivery, actual RSVP submission, expense exports, and private gallery access remain future work. Automated WhatsApp reminders, receipt capture, vendor reconciliation, and QR entry were not added.

### 3. Google sign-in and protected My Weddings entry

- **Status:** In progress — implementation, local checks, and the core live Google/MongoDB journey verified; session-cookie refresh fix and additional expiry/multi-account isolation checks pending.
- **Progress recorded:** 19 November 2026.
- **Commit:** Not committed yet.
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

## Remaining work

The current feature is Google sign-in and the protected My Weddings entry page. Resolve its review finding and finish the remaining live checks first. The following work remains; detailed scope and sequencing must follow the four design documents:

- Session-cookie refresh fix and renewal test; remaining session-expiry, administrative revocation, and multi-account isolation checks; account/profile and development-only email OTP requirements.
- Wedding creation, wedding switching, co-owner onboarding, and server-enforced membership/permissions.
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
