import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { missingOtpEnvVars } from '@/lib/otp';

// Read-only, presence-only config check for the auth/email flow. Gated
// behind ADMIN_BOOTSTRAP_SECRET (the same secret used to create the first
// admin) so it can't be hit anonymously, but never returns actual secret
// values — only booleans/counts — so it's safe to call from a deployed
// environment while diagnosing the 502 / "no verification email" issue.
//
// Usage: POST { "secret": "<ADMIN_BOOTSTRAP_SECRET>" } to /api/admin/diagnostics
export async function POST(request: Request) {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Diagnostics are not configured on this server.' }, { status: 503 });
  }

  let body: { secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send { "secret": "..." } as JSON.' }, { status: 400 });
  }
  if (body.secret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 });
  }

  const missingOtp = missingOtpEnvVars();
  const missingAuthSecret = !process.env.AUTH_SECRET;
  const missingDatabaseUrl = !process.env.DATABASE_URL;

  let databaseReachable = false;
  let databaseError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReachable = true;
  } catch (err) {
    databaseError = err instanceof Error ? err.message : String(err);
  }

  const userCount = databaseReachable ? await prisma.user.count().catch(() => null) : null;

  return NextResponse.json({
    env: {
      SUPABASE_URL: !missingOtp.includes('SUPABASE_URL'),
      SUPABASE_ANON_KEY: !missingOtp.includes('SUPABASE_ANON_KEY'),
      AUTH_SECRET: !missingAuthSecret,
      DATABASE_URL: !missingDatabaseUrl,
    },
    database: { reachable: databaseReachable, error: databaseError, userCount },
    notes: [
      ...(missingOtp.length ? [`Missing env var(s), so /api/auth/otp/send will always fail with 502: ${missingOtp.join(', ')}.`] : []),
      ...(missingAuthSecret ? ['AUTH_SECRET is missing — login/registration cannot mint a session cookie even after a code is verified.'] : []),
      'This endpoint cannot verify Supabase\'s SMTP/Resend setup itself — that lives in the Supabase dashboard (Authentication → Settings → SMTP Settings), not in this app\'s env vars. If env vars above are all true but codes still don\'t arrive, check that dashboard next.',
    ],
  });
}
