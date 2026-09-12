import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthChallenge, createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptSecret, verifyTotp, recordLoginAttempt, maybeSuspendAfterFailures } from '@/lib/security';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tp_auth_challenge')?.value;
  if (!token) return NextResponse.json({ error: 'Your security challenge has expired. Please sign in again.' }, { status: 401 });
  const challenge = await verifyAuthChallenge(token);
  if (!challenge) return NextResponse.json({ error: 'Your security challenge has expired. Please sign in again.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').trim();
  if (!code) return NextResponse.json({ error: 'Enter your authenticator code or a recovery code.' }, { status: 400 });
  const security = await prisma.securityProfile.findUnique({ where: { userId: challenge.userId } });
  if (!security?.twoFactorEnabled || !security.twoFactorSecretEncrypted) return NextResponse.json({ error: 'Two-step verification is not configured for this account.' }, { status: 409 });
  let valid = false;
  let usedRecovery = false;
  if (/^\d{6}$/.test(code)) { try { valid = verifyTotp(decryptSecret(security.twoFactorSecretEncrypted), code); } catch {} }
  if (!valid && security.recoveryCodesHash) { try { const hashes = JSON.parse(security.recoveryCodesHash) as string[]; const idx = hashes.indexOf((await import('@/lib/security')).hashRecoveryCode(code)); if (idx >= 0) { hashes.splice(idx, 1); await prisma.securityProfile.update({ where: { userId: challenge.userId }, data: { recoveryCodesHash: JSON.stringify(hashes) } }); valid = true; usedRecovery = true; } } catch {} }
  await recordLoginAttempt({ userId: challenge.userId, email: challenge.email, action: 'LOGIN_2FA', success: valid, riskLevel: valid ? 'NORMAL' : 'HIGH', failureReason: valid ? null : 'INVALID_2FA_CODE', request });
  if (!valid) { await maybeSuspendAfterFailures(challenge.userId, challenge.email, request).catch(() => {}); return NextResponse.json({ error: 'That authenticator code is invalid or expired.' }, { status: 400 }); }
  await prisma.securityProfile.update({ where: { userId: challenge.userId }, data: { lastTwoFactorVerifiedAt: new Date() } });
  const deviceToken = cookieStore.get('tp_device')?.value;
  const device = deviceToken ? await prisma.recognizedDevice.findFirst({ where: { userId: challenge.userId, tokenHash: (await import('@/lib/security')).deviceHash(deviceToken), revokedAt: null }, select: { id: true } }) : null;
  const sessionToken = await createSession({ userId: challenge.userId, role: challenge.role, email: challenge.email, deviceId: device?.id, twoFactorVerified: true });
  const response = NextResponse.json({ ok: true, redirect: challenge.role === 'ADMIN' || challenge.role === 'SUPER_ADMIN' ? '/dashboard/admin' : challenge.role === 'PROFESSIONAL' ? '/dashboard/professional' : '/dashboard/customer' });
  response.cookies.set('tp_session', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
  response.cookies.set('tp_auth_challenge', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
