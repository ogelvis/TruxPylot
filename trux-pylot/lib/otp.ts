import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

// Server-only client. Used purely to send/verify email OTP codes via
// Supabase Auth — the app's own session cookie (see lib/auth.ts) is what
// actually authorizes requests, so no Supabase session/cookie handling
// is needed here.
let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
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
