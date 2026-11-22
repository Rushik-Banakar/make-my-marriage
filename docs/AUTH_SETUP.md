# Local authentication setup

The homepage runs without secrets. The current authentication configuration requires a MongoDB development database and a Google OAuth web client. Without that configuration, `/login` displays an unavailable message and `/weddings` redirects to login. Signup and password recovery also require an email delivery configuration.

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

## 3. Configure verification email

For delivery to real inboxes, set `AUTH_USE_MAILPIT=false` and configure `AUTH_RESEND_API_KEY` and `AUTH_VERIFICATION_FROM` in the ignored `.env.local`. Use a sending-only key and an authorized sender address. The local setup uses `onboarding@resend.dev`, which can send to the inbox associated with the Resend account. Resend confirmed delivery of a reset code to that inbox. Delivery to other recipients requires a verified sender domain.

For synthetic local email testing, run Mailpit with its web API bound to `127.0.0.1:8025` and SMTP bound to `127.0.0.1:1025`. Set `AUTH_USE_MAILPIT=true` and leave the Resend settings unset. Restart Next.js and open the inbox separately at `http://127.0.0.1:8025`. With both modes configured, Resend takes precedence. Mailpit is available only in development.

If a member initially joined with Google, they can log in with Google or use **Forgot password?** to set an app password. A password signup without a verified email cannot log in until the mailbox is verified. In Mailpit mode, verification links and reset codes are available in the local inbox.

## 4. Verify the real journey

1. Select **Sign up** and submit a name, valid email, separate country code and phone number, and a password. The eye button shows or hides the entry. The current local policy accepts any non-empty password up to 128 characters. Open the verification link within one hour, then log in with the same email and password. Check malformed email, login before verification, and incorrect-password handling.
2. Confirm the redirect to `/weddings` and the signed-in name. A new account should see an empty state with no sample wedding in its private list.
3. Refresh the page and open it in a new tab. The persisted session should still be recognized.
4. Confirm `GET /api/v1/me` contains only the current identity and active wedding memberships. `GET /api/v1/weddings` should be an empty list for a new user.
5. Sign out, then revisit `/weddings`. It must redirect to `/login`. Both application API reads must return 401.
6. Cancel a new Google sign-in attempt and confirm no private workspace becomes accessible. Retry the flow. Provider-reported errors return to the same account page with generic feedback.
7. Verify a revoked or expired session cannot access either protected API. Verify a second test account cannot see the first account's memberships.
8. Select **Log in with Google** at `/login`. Existing Google users retain access. A verified password account can use the same Gmail or Google Workspace address to log in with Google. An unregistered Google account should return to login with guidance and create no application account.
9. Try registering with an existing email, including an unverified account and an uppercase version of the address. Signup should show “An account already exists with this email. Please log in.” The login text is a link. No duplicate account, session, or already-member email should be created. New accounts still receive verification instructions. An existing unverified account must verify its email when it attempts to log in.
10. Select **Forgot password?** and request a code. Existing members receive a six-digit code valid for five minutes, with three verification attempts. Select **Verify code** to unlock the password form. Confirm a wrong or used code fails, the reset rechecks the code, existing sessions are revoked, and only the new password works. Requests for unregistered addresses show the same message and send no email.

Better Auth owns the `user`, `account`, `session`, and `verification` collections and their indexes. Do not hand-edit their schema or seed public mock sessions. Application membership references use the adapter-returned `user.id` string in `weddingMembers.authUserId`.

## Current feature boundary

This increment implements email/password registration with email verification, password reset using an email code, Google login, and read-only membership listing. The phone number is stored as contact information. Phone ownership verification and OTP-based login remain separate increments. A user signing in does not gain wedding ownership automatically.

The automated suite covers configuration, protected-route handling, membership query scope, serialization, and staged password recovery. The original Google login and sign-out were verified locally against MongoDB. The revised Google account-linking callback, a user-completed reset after actual email delivery, and live session renewal, expiry, administrative revocation, and multi-account isolation still need verification. See [Project status](PROJECT_STATUS.md) for the current review findings.

Before hosted testing, configure a verified sender domain and check delivery to a separate test inbox. Set an explicit HTTPS `BETTER_AUTH_URL` and register its exact callback with Google. Use explicit trusted origins for deployed hosts.

References: [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next), [MongoDB adapter](https://www.better-auth.com/docs/adapters/mongo), [Google provider](https://www.better-auth.com/docs/authentication/google).
