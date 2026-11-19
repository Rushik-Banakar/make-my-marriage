# Make My Marriage

Make My Marriage is a planning workspace for Indian weddings. The project uses a single Next.js App Router application with TypeScript, Tailwind CSS, and shadcn/ui.

## Local development

Use Node.js 24 LTS and npm. The public homepage requires no environment variables. Google sign-in requires the six values documented in `.env.example`; follow [the local authentication setup](docs/AUTH_SETUP.md).

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Verification

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

Run `npm start` after a production build to serve it locally.

## Project layout

- `src/app/` contains the App Router. The homepage lives in `(public)`, `/login` in `(auth)`, and protected `/weddings` in `(organizer)`. Future invitation and gallery flows belong in `(guest)`.
- `src/app/api/auth/[...all]/` hosts Better Auth. `/api/v1/me` and `/api/v1/weddings` provide protected account and membership summaries.
- `src/modules/weddings/` contains read-only membership listing. Planning, finance, guests, wedding-site, and media modules will be added with their first feature.
- `src/lib/` holds authentication, MongoDB connection reuse, response envelopes, and membership policy helpers in `src/lib/permissions/`.
- `docs/` contains the project requirements, system design, database design, and API design.
- `docs/PROJECT_STATUS.md` tracks implementation progress and verification limits.
