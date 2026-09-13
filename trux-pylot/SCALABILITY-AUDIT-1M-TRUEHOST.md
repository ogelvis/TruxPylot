# TruxPylot — 1 Million User Scalability Audit

## Scope
This audit is designed to preserve existing functionality while preparing TruxPylot for growth toward 1,000,000 registered users and migration from Render to Truehost.

## Current architecture
- Next.js application
- Prisma ORM
- Supabase/PostgreSQL as the authoritative database
- Paystack for payments/transfers
- Server-side authentication and security controls
- Truehost target hosting environment

## Immediate findings

### Good foundations
- PostgreSQL/Supabase remains the source of truth.
- Prisma uses a singleton client pattern.
- Payment/webhook data uses unique references/provider event IDs in the existing schema.
- Security/login events and notifications already have useful indexes.
- Wallet ledger queries already have wallet/time indexes.

### Changes made in this release
1. Added indexes for high-frequency user, professional, service-request and audit-log access patterns.
2. Reduced the admin growth page from 100 records per dataset to 40 per dataset to avoid rendering/query spikes.
3. Reworked admin users/growth/audit/announcements interfaces to be compact, responsive and bounded on small screens.
4. Removed the hard 2FA gate from authorized admin Control Center/API access. 2FA remains available as an optional security feature instead of blocking normal admin work.
5. Preserved existing routes, models and business flows.

## 10K → 100K → 1M readiness plan

### 10K users
- Keep Supabase/Postgres as the primary database.
- Monitor slow queries and database connection counts.
- Keep Prisma queries bounded with `take`, pagination and selective `select` fields.
- Store large media outside the application server and serve through a CDN/object store.

### 100K users
- Introduce proper server-side caching for public discovery/category data.
- Add a dedicated search index for professional discovery if database search becomes a bottleneck.
- Move high-volume notifications/email/analytics work to background jobs.
- Aggregate analytics instead of writing one heavy database record for every dashboard view.
- Review database indexes using real query plans.

### 1M users
- Run multiple application instances behind a load balancer or equivalent hosting layer.
- Use connection pooling and strict database connection budgets.
- Separate web traffic from workers/cron jobs.
- Use a dedicated search service/index for marketplace discovery.
- Use object storage + CDN for avatars, portfolios and documents.
- Add distributed rate limiting and abuse protection.
- Use event/queue processing for notifications, analytics, referrals and non-critical calculations.
- Partition/archive very large event/audit tables only when real data volume requires it.

## Truehost migration requirements

The application should remain a Node.js deployment; do not rewrite it to PHP/Python merely because hosting is changing.

Before cutover:
- Node.js version must match the supported project version.
- Set every production environment variable in Truehost; never upload `.env` into `public_html`.
- Keep Supabase/PostgreSQL external if that remains the authoritative database.
- Configure the Node application entry point/start command according to the Truehost/cPanel Node runtime.
- Run `npm ci` from the project root.
- Run `npx prisma generate`.
- Run `npx prisma migrate deploy`.
- Run `npm run build`.
- Confirm the production process binds to the host/port required by Truehost's Node application runtime.
- Keep `public_html` only for the web-server mapping/static boundary required by the host; do not move the whole Next.js source tree there unless the hosting configuration explicitly requires it.

## Performance rules
- Never load unbounded database collections into a page.
- Prefer `select` over large `include` graphs where possible.
- Paginate admin/history/activity screens.
- Avoid synchronous third-party API calls for non-critical UI work.
- Cache public service/category data.
- Do not calculate expensive reputation/ranking values repeatedly inside list rendering.
- Keep webhook handlers idempotent.

## Important conclusion
The current architecture is a viable foundation for 1M registered users, but 1M users should be treated as a scaling target rather than a claim about today's capacity. The first real bottlenecks will most likely be database connection/query volume, search/discovery, media delivery, analytics/event writes and background work—not the basic Next.js routing architecture.
