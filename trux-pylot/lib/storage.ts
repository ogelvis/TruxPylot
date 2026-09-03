import { createClient } from '@supabase/supabase-js';

// Server-only client, separate from lib/otp.ts's anon-key client. Avatar
// uploads need to write to a bucket regardless of which browser session
// (if any) is making the request — our own tp_session cookie authorizes
// the request, not a Supabase Auth session — so this uses the SERVICE
// ROLE key, which bypasses Supabase Storage's row-level-security policies
// entirely. Never expose this key to the browser.
let client: ReturnType<typeof createClient> | null = null;

export function missingStorageEnvVars(): string[] {
  return [
    !process.env.SUPABASE_URL && 'SUPABASE_URL',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((v): v is string => Boolean(v));
}

function getServiceClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = missingStorageEnvVars();
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Set them in your deployment environment — see .env.example.`);
  }
  client = createClient(url!, key!, { auth: { persistSession: false } });
  return client;
}

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Uploads a profile photo to the `avatars` bucket under `{userId}/{timestamp}.{ext}`
 *  and returns its public URL. Throws a message-safe-to-show-the-user Error
 *  on validation failure or upload failure. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error('Please upload a JPG, PNG, or WEBP image.');
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Image must be smaller than 5MB.');
  }
  const path = `${userId}/${Date.now()}.${ext}`;
  const supabase = getServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
