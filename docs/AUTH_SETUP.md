# Local Google sign-in setup

The homepage runs without secrets. Real sign-in requires a MongoDB development database and a Google OAuth web client. Until configured, `/login` shows an unavailable message, `/weddings` redirects to login, and no demo identity is substituted.

## 1. Configure MongoDB

Use a dedicated development database on MongoDB Atlas or a local replica set. The Better Auth adapter uses transactions, so a standalone MongoDB server is insufficient for this configuration.

Create a database user scoped to the development database with read/write and index creation access. Configure network access for your development machine rather than opening database access to everyone. Keep development data separate from production and use synthetic test information.

Copy `.env.example` to `.env.local` in the project root. Set `DATABASE_URL` to the connection string and `DATABASE_NAME` to the development database name. Keep credentials URL-encoded in the connection string. Never commit `.env.local` or paste it into chat.

## 2. Configure Google OAuth

In Google Cloud Console, select or create your development project and configure the OAuth consent screen. If the app is in testing mode, add the Google accounts you intend to use as test users.

Create an OAuth client with application type **Web application**:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

Enter the client ID and secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`. Keep `BETTER_AUTH_URL=http://localhost:3000`. Use the same host and port when opening the site; `127.0.0.1`, another port, and `localhost` are different origins.

Generate `BETTER_AUTH_SECRET` locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Paste the output into `.env.local` without sharing it. The secret must be at least 32 characters. Restart `npm run dev` after configuring the values.

## 3. Verify the real journey

1. Open `/login` and select **Continue with Google**. A new account should be created only after Google completes authentication.
2. Confirm the redirect to `/weddings` and the signed-in name. A new account should see an empty state with no sample wedding in its private list.
3. Refresh the page and open it in a new tab. The persisted session should still be recognized.
4. Confirm `GET /api/v1/me` contains only the current identity and active wedding memberships. `GET /api/v1/weddings` should be an empty list for a new user.
5. Sign out, then revisit `/weddings`. It must redirect to `/login`; both application API reads must return 401.
6. Cancel a new Google sign-in attempt and confirm no private workspace becomes accessible. Retry the flow. Provider-reported errors return to the login screen with generic feedback.
7. Verify a revoked or expired session cannot access either protected API. Verify a second test account cannot see the first account's memberships.

Better Auth owns the `user`, `account`, `session`, and `verification` collections and their indexes. Do not hand-edit their schema or seed public mock sessions. Application membership references use the adapter-returned `user.id` string in `weddingMembers.authUserId`.

## Current feature boundary

This increment implements Google authentication and read-only membership listing. Creating weddings, accepting co-owner invitations, opening a wedding dashboard, editing profiles, and development-only email OTP are separate increments. A user signing in does not gain wedding ownership automatically.

The automated tests validate configuration, protected-route handling with mocked sessions, membership query scope, and safe serialization. They do not replace the real Google, MongoDB, session-expiry, revocation, or multi-account checks above. Those checks remain pending until credentials are configured.

Before hosted testing, set an explicit HTTPS `BETTER_AUTH_URL` and register its exact callback with Google. Do not trust arbitrary preview origins. This setup does not deploy or publish the application.

References: [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next), [MongoDB adapter](https://www.better-auth.com/docs/adapters/mongo), [Google provider](https://www.better-auth.com/docs/authentication/google).
