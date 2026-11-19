# Repository guidance

- Read the relevant design documents in `docs/` before making feature or contract changes.
- Read `docs/PROJECT_STATUS.md` before starting feature work to understand completed work, current scope, and remaining work. The PRD, system, database, and API design documents remain authoritative for requirements.
- Update `docs/PROJECT_STATUS.md` when delivering a major new feature or materially changing an existing feature's completion status. Record the date, status, delivered scope, verification results, and remaining limitations or follow-up work. Preserve completed milestones, distinguish sample UI from working backend functionality, and include commit references when available. Do not mark unverified or unfinished work complete.
- Keep this repository as one Next.js modular monolith. Use `@/*` for imports rooted in `src/`.
- Reserve `(public)` for public pages, `(auth)` for authentication pages, `(organizer)` for signed-in wedding management, and `(guest)` for invitation and gallery flows. Route groups share the same URL namespace, so each URL needs one owner.
- Place application Route Handlers under `src/app/api/v1/` and reserve `src/app/api/auth/[...all]/` for Better Auth.
- Keep business logic in the weddings, planning, finance, guests, wedding-site, and media modules. Introduce services, repositories, and schemas as needed. Keep HTTP handlers thin.
- Keep wedding-level authorization and role checks in `src/lib/permissions/`. Enforce tenant scope and permissions on the server.
- Keep local secrets out of Git and document supported variables in `.env.example`.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before wrapping up code changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
