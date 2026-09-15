# TruxPylot Supabase OTP Fix

This build keeps Supabase Auth as the OTP authority. TruxPylot does not impose a client-side OTP expiration timer.

## What was fixed
- The resend countdown is only a resend cooldown; it does not invalidate an OTP.
- OTP input supports mobile numeric keyboards and `one-time-code` autofill.
- OTP values are normalized for mobile copy/paste before being sent to Supabase.
- Server verification requires a 6-digit OTP.
- Supabase error codes are mapped more accurately so a normal invalid code is not falsely reported as expired.
- Supabase remains responsible for OTP expiration and single-use verification.

## Required Supabase dashboard setting
In Supabase, set:

Authentication → Sign In / Providers → Email → Email OTP Expiration

Recommended: `3600` seconds (1 hour).

Also make sure the email template is an OTP/code template containing `{{ .Token }}` and does not expose/use a confirmation URL for the OTP flow. This avoids email-link scanners consuming a one-time token.

## Important
The 60-second "Resend code" message is intentionally retained because Supabase rate-limits OTP requests. It is NOT the OTP expiration period.
