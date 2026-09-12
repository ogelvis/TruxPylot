# TruxPylot Security & Control Upgrade

This build extends the existing TruxPylot application without replacing the working marketplace, authentication flow, MVault/Paystack funding, withdrawals, referrals, messaging, scoring or dashboards.

## Main changes

- Hidden admin entry route: `/dashboard/NgNji`
- Existing admin dashboard remains `/dashboard/admin` after successful admin authentication.
- Admin accounts require 2FA before using protected control-center pages/API actions.
- TOTP 2FA with encrypted setup secret and one-time recovery codes.
- Customer/professional/staff security center with 2FA, password and recovery-question controls.
- Strong 12+ character password policy with upper/lowercase, number and symbol.
- Password sign-in remains alongside the existing email-code sign-in.
- Forgot-password recovery through verified email or saved security question.
- Suspended-account recovery through verified email plus security question, followed by admin review.
- Login-attempt/security-event logging and progressive automatic suspension after repeated failures.
- Recognized-device tracking and repeated login/logout revalidation.
- New-device security notifications.
- Secure profile/document upload validation and suspicious embedded-content rejection.
- Repeated rejected uploads can trigger temporary account protection.
- Admin Security Center with login risks, suspended accounts and upload-security events.
- Admin-controlled System Announcements for customers/professionals.
- Customer/professional dashboard Important Updates section.
- Daily motivational/thought box with short attributed quotes and original TruxPylot sayings.
- TXP BOT exposed as the compact live dashboard assistant.
- Privacy Policy acceptance is required before registration completes.
- Privacy-policy version and acceptance timestamp are recorded.
- Both existing MVault funding methods remain available: Paystack checkout and direct dedicated-account transfer.

## Database

Two migrations were added:

- `20260913000000_security_upgrade`
- `20260913010000_privacy_acceptance`

The existing production build script already runs `prisma migrate deploy`, so the migrations will be applied during deployment.

## Admin first-login behavior

1. Open `/dashboard/NgNji`.
2. Complete the administrator email verification.
3. If 2FA is not yet enabled, TruxPylot sends the administrator to the Security Center.
4. Set up TOTP and confirm the authenticator code.
5. The protected admin dashboard then becomes available at `/dashboard/admin`.

## Important

No new secret environment variable is required for the security features. The existing `AUTH_SECRET` is used for session signing and encryption of TOTP secrets.

The local source was syntax-checked after the upgrade. A complete production build could not be completed in this environment because dependency installation timed out; the final `npm ci`, Prisma generation/migration and `next build` should therefore be run in the deployment environment before release.
