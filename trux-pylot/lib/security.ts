import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { notifyAllAdmins, notifyUser } from '@/lib/notify';
import { sendNotificationEmail } from '@/lib/email';

const PASSWORD_COST = 64 * 1024;
const PASSWORD_BLOCK_SIZE = 8;
const PASSWORD_PARALLELIZATION = 1;
const PASSWORD_KEYLEN = 64;
const MAX_FAILED_WINDOW_MS = 15 * 60 * 1000;
const SUSPEND_AFTER_FAILURES = 7;
const DEVICE_COOKIE = 'tp_device';

function authKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return createHash('sha256').update(secret).digest();
}

export function hashSecret(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, PASSWORD_KEYLEN, { N: PASSWORD_COST, r: PASSWORD_BLOCK_SIZE, p: PASSWORD_PARALLELIZATION });
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export function hashSecurityAnswer(answer: string) { return hashPassword(answer.trim().toLowerCase()); }
export function verifySecurityAnswer(answer: string, stored: string) { return verifyPassword(answer.trim().toLowerCase(), stored); }

export function verifyPassword(password: string, stored: string) {
  try {
    const [scheme, salt, hex] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hex) return false;
    const expected = Buffer.from(hex, 'hex');
    const actual = scryptSync(password, salt, expected.length, { N: PASSWORD_COST, r: PASSWORD_BLOCK_SIZE, p: PASSWORD_PARALLELIZATION });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

function base32Encode(input: Buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; let output = '';
  for (const byte of input) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}
function base32Decode(input: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0; let value = 0; const out: number[] = [];
  for (const char of input.replace(/=+$/,'').replace(/\s+/g,'').toUpperCase()) {
    const idx = alphabet.indexOf(char); if (idx < 0) throw new Error('Invalid TOTP secret');
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export function generateTotpSecret() { return base32Encode(randomBytes(20)); }

export function totpCode(secret: string, counter = Math.floor(Date.now() / 1000 / 30)) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const num = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(num).padStart(6, '0');
}

export function verifyTotp(secret: string, code: string, window = 1) {
  const clean = code.replace(/\D/g, '');
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -window; delta <= window; delta++) {
    if (totpCode(secret, now + delta) === clean) return true;
  }
  return false;
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', authKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value: string) {
  const [ivB64, tagB64, dataB64] = value.split('.');
  const decipher = createDecipheriv('aes-256-gcm', authKey(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => randomBytes(5).toString('hex').toUpperCase());
}

export function hashRecoveryCode(code: string) { return createHash('sha256').update(code.replace(/[^a-z0-9]/gi, '').toLowerCase()).digest('hex'); }
export function hashToken(value: string) { return createHash('sha256').update(value).digest('hex'); }

export function deviceHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function createDeviceToken() { return randomBytes(32).toString('base64url'); }

export function getClientMeta(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  const fingerprint = createHash('sha256').update(`${ipAddress || 'unknown'}|${userAgent || 'unknown'}`).digest('hex');
  return { ipAddress, userAgent, fingerprint };
}

export async function recordLoginAttempt(data: {
  userId?: string | null; email?: string | null; action: string; success?: boolean; riskLevel?: string; failureReason?: string | null; request: Request; deviceFingerprint?: string | null; metadata?: Record<string, unknown>;
}) {
  const meta = getClientMeta(data.request);
  return prisma.loginAttempt.create({ data: {
    userId: data.userId ?? null,
    email: data.email?.toLowerCase() ?? null,
    action: data.action,
    success: data.success ?? false,
    riskLevel: data.riskLevel ?? 'NORMAL',
    failureReason: data.failureReason ?? null,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    deviceFingerprint: data.deviceFingerprint ?? meta.fingerprint,
    metadata: data.metadata as any,
  }});
}

export async function maybeSuspendAfterFailures(userId: string, email: string, request: Request) {
  const since = new Date(Date.now() - MAX_FAILED_WINDOW_MS);
  const failures = await prisma.loginAttempt.count({ where: { userId, success: false, createdAt: { gte: since }, action: { in: ['LOGIN_OTP_VERIFY', 'LOGIN_PASSWORD', 'LOGIN_2FA'] } } });
  if (failures < SUSPEND_AFTER_FAILURES) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true } });
  if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') return false;
  const until = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED', suspendedUntil: until, suspensionReason: 'Repeated unsuccessful authentication attempts' } }),
    prisma.accountSuspension.create({ data: { userId, status: 'PENDING_REVIEW', reason: 'Repeated unsuccessful authentication attempts', source: 'AUTOMATIC_SECURITY', riskScore: Math.min(100, failures * 10) } }),
  ]);
  await notifyUser({ userId, type: 'SECURITY_SUSPENSION', title: 'Account temporarily suspended', body: 'We detected repeated unsuccessful sign-in attempts. Your account has been temporarily suspended while we protect it.', link: user.role === 'PROFESSIONAL' ? '/dashboard/professional/settings' : user.role === 'CUSTOMER' ? '/dashboard/customer/settings' : '/dashboard/admin/security' }).catch(() => {});
  await notifyAllAdmins({ type: 'SECURITY_REVIEW', title: 'Security review required', body: `A ${user.role.toLowerCase()} account was automatically suspended after repeated failed authentication attempts.`, link: '/dashboard/admin/security' });
  try { await sendNotificationEmail({ to: email, subject: 'TruxPylot security alert', title: 'Account temporarily suspended', body: 'We detected repeated unsuccessful sign-in attempts. Your account has been temporarily suspended for protection.' }); } catch (error) { console.error('[security] suspension email failed', error instanceof Error ? error.message : error); }
  await recordLoginAttempt({ userId, email, action: 'ACCOUNT_AUTO_SUSPENDED', success: true, riskLevel: 'HIGH', request, metadata: { failures } });
  return true;
}

export async function ensureDevice(userId: string, token: string, request: Request) {
  const meta = getClientMeta(request);
  const tokenHash = deviceHash(token);
  const existing = await prisma.recognizedDevice.findUnique({ where: { tokenHash } });
  if (existing && existing.userId === userId && !existing.revokedAt) {
    await prisma.recognizedDevice.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    return { id: existing.id, isNew: false };
  }
  const created = await prisma.recognizedDevice.create({ data: { userId, tokenHash, label: labelFromUserAgent(meta.userAgent), ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
  return { id: created.id, isNew: true };
}

function labelFromUserAgent(ua: string | null) {
  if (!ua) return 'Unknown device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Device';
  return `${browser} on ${os}`;
}

export function deviceCookieName() { return DEVICE_COOKIE; }

export async function repeatedLoginLogoutNeedsRevalidation(userId: string, deviceFingerprint: string) {
  const events = await prisma.loginAttempt.findMany({ where: { userId, deviceFingerprint, action: { in: ['LOGIN_SUCCESS', 'LOGOUT'] } }, orderBy: { createdAt: 'desc' }, take: 10, select: { action: true } });
  if (events.length < 10) return false;
  const first = events[0].action;
  for (let i = 0; i < 10; i++) {
    const expected = i % 2 === 0 ? first : (first === 'LOGOUT' ? 'LOGIN_SUCCESS' : 'LOGOUT');
    if (events[i].action !== expected) return false;
  }
  return first === 'LOGOUT' || first === 'LOGIN_SUCCESS';
}

