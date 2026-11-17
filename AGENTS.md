# Repository guidance

- Read the relevant design documents in `docs/` before making feature or contract changes.
- Keep this repository as one Next.js modular monolith. Use `@/*` for imports rooted in `src/`.
- Reserve `(public)` for public pages, `(auth)` for authentication pages, `(organizer)` for signed-in wedding management, and `(guest)` for invitation and gallery flows. Route groups share the same URL namespace, so each URL needs one owner.
- Place application Route Handlers under `src/app/api/v1/` and reserve `src/app/api/auth/[...all]/` for Better Auth.
- Keep business logic in the weddings, planning, finance, guests, wedding-site, and media modules. Introduce services, repositories, and schemas as needed. Keep HTTP handlers thin.
- Keep wedding-level authorization and role checks in `src/lib/permissions/`. Enforce tenant scope and permissions on the server.
- Keep local secrets out of Git and document supported variables in `.env.example`.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before wrapping up code changes.
