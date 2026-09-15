# TruxPylot Registration Fix — Deploy Immediately

## What was fixed in code

1. The registration wizard no longer calls the legacy `/api/auth/register` endpoint.
2. Registration now calls `/api/auth/otp/send` and then `/api/auth/otp/verify`.
3. The registration UI now has a real 6-digit email OTP screen.
4. OTP input supports mobile numeric keyboards and one-time-code autofill.
5. Registration draft state survives a page refresh while waiting for the code.
6. Resend requests are throttled to match Supabase's email rate limits.
7. Phone-number conflicts are detected before an OTP is consumed.
8. If Prisma account creation fails after Supabase consumes the OTP, the new Supabase Auth identity is cleaned up so the user is not stranded in a half-created account.
9. OTP server configuration accepts either the private `SUPABASE_*` variables or the common `NEXT_PUBLIC_SUPABASE_*` aliases.
10. Google registration remains on its existing flow.
11. Existing login and 2FA flows remain on their existing OTP endpoints.

## Required production checks

The code cannot manufacture a Supabase project or SMTP sender. Before declaring production registration healthy, verify these Render environment variables exist:

- `DATABASE_URL`
- `AUTH_SECRET`
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`

Also verify in Supabase Authentication → Email that the OTP email template includes `{{ .Token }}`. If the template only contains `{{ .ConfirmationURL }}`, users will receive a link rather than the six-digit code expected by the TruxPylot registration UI.

Use a real/custom SMTP sender for production rather than relying on Supabase's limited default sender.

## Deployment

Build/migration command:

```bash
npx prisma migrate deploy && next build
```

Then restart/redeploy the service so the new client bundle is served.

## Smoke test

1. Open `/register` in a private/incognito window.
2. Complete the registration wizard with a brand-new email.
3. Click `Create account`.
4. Confirm the page changes to `Check your email` instead of immediately attempting to create the account.
5. Enter the six-digit code.
6. Confirm redirect to the correct dashboard.
7. Sign out.
8. Sign back in using the same email through the existing login flow.

## Important

Do not increase the old `/api/auth/register` rate limit to hide the previous error. The production registration UI is now intentionally routed through the Supabase OTP flow.
