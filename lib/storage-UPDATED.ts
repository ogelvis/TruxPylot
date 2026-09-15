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

export { getServiceClient };

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

const VERIFICATION_BUCKET = 'verification-docs';
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOC_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

/** Uploads an identity/credential document to a PRIVATE bucket (unlike
 *  avatars, these are never publicly readable) and returns the storage
 *  path — stored in VerificationDocument.privateKey. Callers must fetch
 *  a short-lived signed URL (see getVerificationDocumentUrl) to view it;
 *  the path alone grants no access. */
export async function uploadVerificationDocument(professionalId: string, file: File): Promise<{ path: string; mimeType: string; size: number }> {
  const ext = ALLOWED_DOC_TYPES[file.type];
  if (!ext) {
    throw new Error('Please upload a JPG, PNG, or PDF file.');
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new Error('Each file must be smaller than 10MB.');
  }
  const path = `${professionalId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = getServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(VERIFICATION_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return { path, mimeType: file.type, size: file.size };
}

/** Generates a short-lived (5 minute) signed URL for an admin to view a
 *  submitted verification document. Never returns a permanent/public URL —
 *  these documents may contain identity information. */
export async function getVerificationDocumentUrl(path: string): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage.from(VERIFICATION_BUCKET).createSignedUrl(path, 60 * 5);
  if (error || !data) throw error ?? new Error('Could not generate a document link.');
  return data.signedUrl;
}
