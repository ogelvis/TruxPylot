# TruxPylot Authentication & Job Marketplace Upgrade

Implemented in this build:

- Email/password registration with an 8-character minimum and uppercase/lowercase/number/special-character requirements.
- Confirm-password matching and show/hide controls.
- Live password-strength indicator.
- Passwords continue to be stored as scrypt hashes through the existing security layer.
- Password-first login remains available; OTP is retained as an optional login/revalidation path.
- Mandatory email verification remains part of new account activation.
- Google OAuth start/callback/onboarding flow (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).
- Clear Professional, Job Giver and Business identity tags.
- Job Givers can post openings from their customer profile.
- Public job-giver profiles show open jobs.
- Professionals can express interest with editable quick-response suggestions.
- Job Givers receive an in-app notification and email; TruxPylot/CSD receives an email and admin notification.
- Duplicate interest submissions are blocked.
- New database migration for job postings, job interests and Google account identifiers.
- Existing ADMIN role/authentication is preserved.

## Google OAuth setup

Set:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

The Google OAuth redirect URI is:

`https://YOUR-APP-DOMAIN/api/auth/google/callback`

Use the same domain configured in `NEXT_PUBLIC_APP_URL`.
