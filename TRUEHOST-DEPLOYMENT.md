# TruxPylot — Truehost cPanel / Node.js deployment

This project is prepared for Truehost cPanel's **Setup Node.js App** using
Node.js 20.x, Production mode, and the custom `server.js` entry point.

## cPanel application settings

Use:

- Node.js version: **20.20.2** (or another available Node 20.x release)
- Application mode: **Production**
- Application root: `truxpylot`
- Application URL: `https://truxpylot.com`
- Application startup file: `server.js`

Do not use Node.js 10.x.

## Files

The project intentionally does not contain `node_modules/` or `.next/`.
Truehost should create dependencies on the server.

Required root files include:

- `package.json`
- `package-lock.json`
- `server.js`
- `next.config.ts`
- `prisma/`
- `app/`
- `components/`
- `lib/`
- `public/`

The old root `app.js` and static prototype files are not the Next.js entry point.
The cPanel startup file must be `server.js`.

## Install and build

After creating the Node.js application, copy the activation command shown by
Truehost and run it in cPanel Terminal. Then:

```bash
cd ~/truxpylot
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run build
```

Restart the application from **cPanel -> Setup Node.js App**.

If `npm ci` reports that `node_modules` already exists outside the virtual
environment, remove the uploaded `node_modules` directory and run `npm ci`
again. Never upload your local `node_modules`.

## Required environment variables

Copy `.env.example` as a checklist. Add the real values in cPanel's
**Environment Variables** section. Do not upload `.env`.

At minimum, production requires:

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://truxpylot.com`
- `DATABASE_URL`
- `AUTH_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CSD_EMAIL` / `SUPPORT_EMAIL`

Google login additionally requires:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

The AI chat feature additionally requires:

- `OPENAI_API_KEY`
- optionally `TRUXPYLOT_CHAT_MODEL`

Scheduled/cron endpoints require:

- `CRON_SECRET`

## Supabase / Prisma

Supabase remains the database and Auth provider. Truehost only runs the
Next.js application.

Do not create a second database on Truehost.

Run:

```bash
npx prisma migrate status
```

before:

```bash
npx prisma migrate deploy
```

Never use `prisma migrate dev` on the production database.

## Supabase email OTP

Supabase remains the authority for OTP generation, expiry and single-use.

In Supabase Authentication settings:

- Configure the Email OTP expiration to the intended production value
  (recommended by Supabase documentation: 3600 seconds or lower).
- The OTP email template should contain `{{ .Token }}` for a manually entered
  six-digit code.
- Keep the app's 60-second resend countdown as a resend cooldown only; it is
  not an OTP validity timer.

## Google OAuth

After moving the domain, update the Google OAuth authorized redirect URI to:

`https://truxpylot.com/api/auth/google/callback`

The application no longer silently falls back to the old Render URL.

## Paystack

Set:

```text
NEXT_PUBLIC_APP_URL=https://truxpylot.com
```

Paystack callback URLs are generated from that value.

## Email

The application sends transactional mail through the configured Resend API
integration. Keep:

```text
RESEND_FROM_EMAIL=Trux Pylot <verify@truxpylot.com>
```

only if `truxpylot.com` remains verified in Resend.

## Logs

If the application fails after restart, check the Node/Passenger `stderr.log`
and cPanel **Errors** page. Typical causes are:

- missing environment variable
- wrong `DATABASE_URL`
- Prisma migration failure
- missing dependency
- incorrect startup file
- insufficient hosting resources

Do not change the working Render deployment or DNS until the Truehost copy
passes registration, OTP, login, Google OAuth, dashboard, wallet, Paystack,
email and admin tests.
