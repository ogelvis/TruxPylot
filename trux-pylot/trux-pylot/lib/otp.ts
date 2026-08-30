import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

// Server-only client. Used purely to send/verify email OTP codes via
// Supabase Auth — the app's own session cookie (see lib/auth.ts) is what
// actually authorizes requests, so no Supabase session/cookie handling
// is needed here.
let client: ReturnType<typeof createClient> | null = null;

/** Which required env vars for the OTP client are missing, if any. Safe to
 *  expose (names only, never values) — used by the send/verify routes for
 *  logging and by the admin diagnostics endpoint. */
export function missingOtpEnvVars(): string[] {
  return [
    !process.env.SUPABASE_URL && 'SUPABASE_URL',
    !process.env.SUPABASE_ANON_KEY && 'SUPABASE_ANON_KEY',
  ].filter((v): v is string => Boolean(v));
}

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const missing = missingOtpEnvVars();
  if (missing.length) {
    // This is the #1 cause of the send/verify routes returning 502: the
    // client throws before ever reaching Supabase. Fail loudly with the
    // exact var name(s) so it shows up clearly in server logs.
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Set them in your deployment environment — see .env.example.`);
  }
  client = createClient(url!, anonKey!, { auth: { persistSession: false } });
  return client;
}

/** Normalizes an email the same way everywhere it's used as a lookup key
 *  (Prisma `User.email` and Supabase's own internal storage are both
 *  case-sensitive/normalized-lowercase respectively) so "Jane@Example.com"
 *  at registration and "jane@example.com" at login resolve to the same
 *  account instead of silently failing to match. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Extracts a loggable, non-sensitive shape from an unknown thrown error —
 *  Supabase's AuthError carries `status` (e.g. 429 for rate limits) and
 *  `code` alongside `message`, which plain `Error` handling would drop. */
export function describeOtpError(err: unknown): { message: string; status?: number; code?: string } {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; status?: number; code?: string };
    return { message: e.message ?? String(err), status: e.status, code: e.code };
  }
  return { message: String(err) };
}

/**
 * Sends a 6-digit email OTP.
 * - shouldCreateUser: true for registration (creates the Supabase auth user
 *   if it doesn't exist yet, and stores `data` as that user's metadata).
 * - shouldCreateUser: false for login (fails quietly if no Supabase user
 *   exists for that email, since we already checked our own DB first).
 */
export async function sendEmailOtp(
  email: string,
  opts: { shouldCreateUser: boolean; data?: Record<string, unknown> }
) {
  const supabase = getClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: opts.shouldCreateUser, data: opts.data },
  });
  if (error) throw error;
}

/** Verifies a 6-digit email OTP and returns the Supabase auth user on success. */
export async function verifyEmailOtp(email: string, token: string): Promise<SupabaseUser> {
  const supabase = getClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.user) throw error ?? new Error('Verification failed');
  return data.user;
}
