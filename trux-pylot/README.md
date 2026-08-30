# Trux Pylot

Full-stack service-marketplace foundation: Next.js, PostgreSQL/Prisma, role-based sessions, jobs, verification, wallet accounting and Paystack server-side payment flow.

## Run locally

1. Copy `.env.example` to `.env` and fill in values.
2. Run `npm install`.
3. Create PostgreSQL database, then run `npx prisma migrate dev`.
4. Run `npm run dev`.

## Deploy

Use Render for the Node web service and managed PostgreSQL. Set environment variables in Render; do not commit `.env`. Build command: `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build`. Start command: `npm run start`.

Set Paystack webhook to `/api/payments/paystack/webhook`. Paystack payment confirmation comes only from the signed webhook, never from a browser callback.

## Security notes

Authentication sessions use HTTP-only cookies. Routes validate user role server-side. Verification documents are represented with private storage keys and must be served only by authorized server endpoints. Add rate limiting, email verification, and malware scanning before public launch.
