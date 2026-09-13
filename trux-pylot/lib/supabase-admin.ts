import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export async function getSupabaseAuthUserById(id: string): Promise<{ user: SupabaseUser | null; missing: boolean }> {
  const { data, error } = await getClient().auth.admin.getUserById(id);
  if (!error && data.user) return { user: data.user, missing: false };
  const status = (error as { status?: number } | null)?.status;
  const code = (error as { code?: string } | null)?.code;
  const message = error?.message ?? '';
  if (status === 404 || code === 'user_not_found' || /not found/i.test(message)) {
    return { user: null, missing: true };
  }
  throw error ?? new Error('Could not check the Supabase Auth user.');
}

export async function deleteSupabaseAuthUser(id: string) {
  const { error } = await getClient().auth.admin.deleteUser(id, false);
  if (error) throw error;
}
