# Make My Marriage

Make My Marriage is a planning workspace for Indian weddings. The project uses a single Next.js App Router application with TypeScript, Tailwind CSS, and shadcn/ui.

## Local development

Use Node.js 24 LTS and npm. The scaffold requires no environment variables.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Verification

```sh
npm run lint
npm run typecheck
npm run build
```

Run `npm start` after a production build to serve it locally.

## Project layout

- `src/app/` contains the App Router. The homepage lives in `(public)`. Future routes include `/login` in `(auth)`, `/weddings` in `(organizer)`, and `/invite` and `/gallery` in `(guest)`.
- `src/modules/` will contain weddings, planning, finance, guests, wedding-site, and media. Add each module when its first feature is implemented.
- `src/lib/` holds shared infrastructure. Wedding-level authorization and role checks will live in `src/lib/permissions/`.
- `docs/` contains the project requirements, system design, database design, and API design.
