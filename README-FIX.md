# Trux Pylot — fixed & migrated to Supabase email OTP

This is your full project, cleaned up and switched over to passwordless
Supabase Auth (email OTP), replacing both the abandoned Twilio phone
verification and the old password + nodemailer email-link system.

## What was broken (fixed)

- **Duplicate nested folder**: the repo had a full second copy of the app
  sitting inside `trux-pylot/trux-pylot/`. Removed.
- **Dead Twilio code**: `app/api/phone/`, `app/api/auth/phone/`, and
  `lib/twilio-verify.ts` were leftover, unused, and one of them had the
  wrong logic copy-pasted into it. Removed entirely — nothing in the UI
  ever called them.
- **Next.js 15 deprecation warning** (`Unsupported metadata themeColor`):
  moved `themeColor` from `metadata` to its own `viewport` export in
  `app/layout.tsx`.

## What changed (Supabase migration)

The app's own session system (`lib/auth.ts` — the `tp_session` cookie) is
**untouched** and still controls access to `/dashboard/*` via
`middleware.ts` and `lib/guard.ts`. Supabase is used for exactly one
thing: sending and verifying the 6-digit email code. Once verified, the
app mints its own session cookie same as before.

**New:**
- `lib/otp.ts` — thin wrapper around Supabase's `signInWithOtp` /
  `verifyOtp`, server-side only.
- `POST /api/auth/otp/send` — `{ mode: 'register', email, fullName, role, ... }`
  or `{ mode: 'login', email }`. Sends the code. For registration, your
  profile fields ride along as Supabase user metadata until you verify.
- `POST /api/auth/otp/verify` — `{ email, code }`. Verifies the code. If
  no matching account exists yet, creates it from the metadata (this is
  what completes registration). Otherwise logs the existing user in.
  Mints the `tp_session` cookie either way.

**Removed** (all password/email-link-based, now redundant):
- `passwordHash`, `emailVerifiedAt`, `phoneVerifiedAt` columns on `User`
- `EmailVerificationToken` and `PasswordResetToken` models
- `lib/email.ts`, `lib/verification.ts`, `lib/password-reset.ts`
- Routes: `register`, `login`, `change-password`, `forgot-password`,
  `reset-password`, `change-pending-email`, `resend-verification`,
  `verify-email`
- Pages: `/forgot-password`, `/reset-password`, `/verify-email/pending`
- Components: `password-form`, `forgot-password-form`,
  `reset-password-form`, `verification-pending-actions`
- `bcryptjs` and `nodemailer` from `package.json` (no longer used
  anywhere)

**Updated:**
- `components/register-wizard.tsx` — the old password step is now an
  email-code step. Avatar upload was removed from registration (to
  avoid stuffing a base64 image into Supabase's metadata) — add a
  profile photo from Settings after signing up instead.
- `components/auth-form.tsx` (login) — email → code, two steps, no
  password field.
- `lib/guard.ts` — dropped the `emailVerifiedAt` check, since an account
  can no longer exist in an unverified state.
- `app/api/admin/bootstrap/route.ts` — sends an OTP the same way
  registration does; finish by calling `/api/auth/otp/verify` with the
  code. (`otp/verify` logs a `BOOTSTRAP_ADMIN_CREATED` audit entry when
  the created user's role is `ADMIN`, same as before.)
- `prisma/seed.ts` — no more `passwordHash`; the seeded demo
  professional now needs an explicit `id` (since `User.id` no longer
  auto-generates — see below) and can't actually log in through the UI
  (it has no matching Supabase auth user). It's just marketplace demo
  data.
- Settings pages (`dashboard/customer/settings`,
  `dashboard/professional/settings`) — "Change password" panel removed.

### Why `User.id` changed

`User.id` used to auto-generate (`@default(cuid())`). Now it's set
explicitly, always equal to the corresponding Supabase Auth user's `id`,
so your `User` row and Supabase's `auth.users` row for the same person
share one id. This happens automatically in `otp/verify` — you don't
need to do anything, just know that a raw `prisma.user.create()`
anywhere else in the app now requires an explicit `id`.

## Setup steps

### 1. Environment variables

```
DATABASE_URL=...                  # unchanged, from Supabase (Postgres connection string)
AUTH_SECRET=...                   # unchanged, used to sign the tp_session cookie
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=...             # the anon/public key, Project Settings → API
ADMIN_BOOTSTRAP_SECRET=...        # unchanged, only needed once to create the first admin
```

You can **remove** these — nothing reads them anymore:
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

Note these are plain (not `NEXT_PUBLIC_`) — the Supabase client only
runs server-side in `lib/otp.ts`, so nothing here is exposed to the
browser.

### 2. Configure Supabase for OTP codes, not magic links

In your Supabase dashboard → **Authentication → Emails → Confirm signup**
(and **Magic Link**) template, make sure the template includes
`{{ .Token }}` (the 6-digit code) — that's what `verifyOtp` checks.
If the template only has `{{ .ConfirmationURL }}`, the email will show a
link instead of a code your users can type in.

Also set up **custom SMTP** (Authentication → Settings → SMTP Settings)
with a real provider like Resend — Supabase's built-in sender is
rate-limited and meant for testing only, which is very likely why codes
weren't arriving before.

### 3. Install and migrate

```bash
npm install       # picks up @supabase/supabase-js, drops bcryptjs/nodemailer
npx prisma migrate dev --name supabase_otp_auth
```

This migration drops `passwordHash`, `emailVerifiedAt`, `phoneVerifiedAt`,
and the two token tables. Since you already truncated the `User` table
earlier, there's no meaningful data loss.

### 4. Deploy

Push to your repo as usual. On Render, make sure your build command runs
migrations against production before building, e.g.:

```bash
npx prisma migrate deploy && next build
```

Add the same env vars from step 1 in Render's **Environment** tab, then
redeploy.

## Round 2: "login fails / no verification email / 502" — root cause & fixes

Symptom recap: registration/login always returns a 502 from
`POST /api/auth/otp/send`, no verification email ever arrives, and
users can never log in. All three are **one root cause, not three bugs**:
`sendEmailOtp()` in `lib/otp.ts` throws before it ever reaches Supabase,
the route catches that and — by design — returns HTTP 502 (see the
`catch` blocks in `app/api/auth/otp/send/route.ts`). No email goes out
because the call never got there, and login is blocked for the same
reason sign-in also needs a code sent first.

**Two concrete causes were found and fixed in code:**

1. **No `.env.example` shipped with the repo at all**, despite the root
   `README.md` telling you to copy one. That made it easy to deploy
   with the *old* env vars (`SMTP_HOST`/`SMTP_USER`/etc. from the
   pre-Supabase version) still set and `SUPABASE_URL` /
   `SUPABASE_ANON_KEY` missing — which is exactly what makes
   `getClient()` throw on every single call, i.e. a guaranteed, 100%
   reproducible 502. Added `.env.example` with the complete, current
   list (see below) and a header explaining the Resend/Supabase wiring.

2. **Email case-sensitivity mismatch** between registration and login.
   `User.email` in Postgres is case-sensitive; nothing normalized casing
   before this fix. Someone who registered as `Jane@Example.com` and
   later typed `jane@example.com` to sign in would get a plain
   *"No account found with that email"* — which reads exactly like
   "can't log in". Fixed by normalizing (trim + lowercase) every email
   at the one place it enters the system (`lib/otp.ts`'s
   `normalizeEmail`), applied consistently in `otp/send`, `otp/verify`,
   and `admin/bootstrap`. `otp/verify` also now uses the email Supabase
   itself confirms on the authenticated user as the source of truth,
   rather than blindly trusting the client-sent string.

**Also added, to make the remaining (dashboard-side) cause diagnosable
without guessing:**

- `lib/otp.ts` now reports exactly which env var(s) are missing in its
  thrown error (`missingOtpEnvVars`), instead of a generic message.
- `otp/send`, `otp/verify`, and `admin/bootstrap` now log the real
  Supabase error (`status`/`code`/`message`) server-side via
  `describeOtpError`, and echo it back in the JSON response as a
  `debug` field **only when `NODE_ENV !== 'production'`** — never in
  prod, so nothing sensitive leaks to real users.
- Rate-limited Supabase responses (`status === 429`, e.g. hitting the
  built-in mailer's send limit) now surface as HTTP 429 with a
  "wait a few minutes" message instead of being lumped into the same
  502 as a hard config failure — this distinguishes "Resend/SMTP isn't
  configured yet" (persistent 502) from "you're on Supabase's rate-limited
  test mailer" (intermittent 429 after a handful of sends).
- New `POST /api/admin/diagnostics` (guarded by `ADMIN_BOOTSTRAP_SECRET`,
  same convention as `/api/admin/bootstrap`): returns which required env
  vars are present (booleans only, never values), whether the database
  is reachable, and a note pointing at the Supabase SMTP dashboard if
  everything in-app checks out but codes still aren't arriving.

**What is *not* a code fix, because it isn't in this repo** — this is
the part you still have to do by hand once, per the "Configure Supabase"
section above:

- Supabase dashboard → **Authentication → Settings → SMTP Settings**:
  point it at Resend (`smtp.resend.com`, your Resend API key as the
  password, a sender address on a domain verified inside Resend). Until
  this is set, Supabase silently falls back to its own heavily
  rate-limited test mailer.
- Supabase dashboard → **Authentication → Emails**: the "Confirm signup"
  and "Magic Link" templates must contain `{{ .Token }}`.
- Render → **Environment**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` must
  actually be set to that project's values (copy from `.env.example`).

### Verifying the fix

1. `POST /api/admin/diagnostics` with your `ADMIN_BOOTSTRAP_SECRET` —
   confirm `env.SUPABASE_URL`, `env.SUPABASE_ANON_KEY`, `env.AUTH_SECRET`,
   `env.DATABASE_URL` are all `true` and `database.reachable` is `true`.
   If any are `false`, that's the 502 cause — fix it in Render's
   Environment tab and redeploy before going further.
2. Register a brand-new test account through `/register`. The
   `otp/send` call should return `200 { ok: true }`, not 502/429.
3. Check the inbox (and spam folder) for the 6-digit code. If step 1
   passed but no email arrives, the cause is the Supabase SMTP/Resend
   dashboard wiring, not this app's code — revisit the "not a code fix"
   list above.
4. Submit the code to `/api/auth/otp/verify` — expect a redirect to
   `/dashboard/customer` or `/dashboard/professional` and a `tp_session`
   cookie set.
5. Reload the dashboard route directly (new tab, same session) to
   confirm `middleware.ts` + `lib/guard.ts` let an authenticated session
   through.
6. Sign out, then sign back in with the same email typed in a
   **different case** (e.g. all-uppercase) — confirms the
   case-normalization fix; it should still find the account.

## Not touched / still there

`app.js`, `index.html`, and `styles.css` at the repo root are a
standalone static HTML prototype, unrelated to and unused by the actual
Next.js app (which lives entirely under `app/`, using
`app/globals.css`). They don't affect the build — Next.js never reads
them — but they're dead weight if you don't need that old prototype
anymore. Left in place since deleting wasn't asked for.
