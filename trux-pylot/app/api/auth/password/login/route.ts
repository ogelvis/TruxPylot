import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAuthChallenge, createSession, dashboardPath } from '@/lib/auth';
import { verifyPassword, createDeviceToken, ensureDevice, deviceHash, getClientMeta, maybeSuspendAfterFailures, recordLoginAttempt } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmailOtp } from '@/lib/otp';
import { repeatedLoginLogoutNeedsRevalidation } from '@/lib/security';
import { notifyUser } from '@/lib/notify';
import { sendNotificationEmail } from '@/lib/email';

const input = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = rateLimit(`password-login:${email}:${ip}`, 8, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many sign-in attempts. Please wait and try again.' }, { status: 429 });
  const user = await prisma.user.findUnique({ where: { email }, include: { securityProfile: true } });
  if (!user || !user.securityProfile?.passwordHash) { await recordLoginAttempt({ userId: user?.id, email, action: 'LOGIN_PASSWORD', success: false, riskLevel: 'MEDIUM', failureReason: 'PASSWORD_AUTH_UNAVAILABLE', request }).catch(()=>{}); return NextResponse.json({ error: 'Email/password sign-in is not available for this account. Use email verification instead.' }, { status: 401 }); }
  if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'This account is not currently available for sign in.' }, { status: 403 });
  const valid = verifyPassword(parsed.data.password, user.securityProfile.passwordHash);
  await recordLoginAttempt({ userId: user.id, email, action: 'LOGIN_PASSWORD', success: valid, riskLevel: valid ? 'NORMAL' : 'HIGH', failureReason: valid ? null : 'INVALID_PASSWORD', request });
  if (!valid) { await maybeSuspendAfterFailures(user.id, user.email, request).catch(() => {}); return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 }); }
  const meta = getClientMeta(request); const deviceToken = request.headers.get('cookie')?.match(/(?:^|;\s*)tp_device=([^;]+)/)?.[1] || createDeviceToken();
  const device = await ensureDevice(user.id, deviceToken, request);
  const needsEmailRevalidation = await repeatedLoginLogoutNeedsRevalidation(user.id, deviceHash(deviceToken)).catch(() => false);
  if (needsEmailRevalidation) { try { await sendEmailOtp(user.email, { shouldCreateUser: false }); } catch {} const response = NextResponse.json({ requiresEmailVerification: true }); response.cookies.set('tp_device', deviceToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 }); return response; }
  if (device.isNew) { await notifyUser({ userId: user.id, type: 'SECURITY_NEW_DEVICE', title: 'New device signed in', body: 'A new device was used to sign in to your TruxPylot account. If this was not you, review your security settings.', link: user.role === 'PROFESSIONAL' ? '/dashboard/professional/settings' : '/dashboard/customer/settings' }).catch(()=>{}); try { await sendNotificationEmail({ to: user.email, subject: 'New TruxPylot sign-in', title: 'New device signed in', body: 'A new device was used to sign in to your TruxPylot account. If this was not you, review your security settings.' }); } catch {} }
  if (user.securityProfile.twoFactorEnabled) {
    const challenge = await createAuthChallenge({ userId: user.id, role: user.role, email: user.email, purpose: 'LOGIN_2FA' });
    const response = NextResponse.json({ requires2FA: true, redirect: dashboardPath(user.role) });
    response.cookies.set('tp_auth_challenge', challenge, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    response.cookies.set('tp_device', deviceToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
    return response;
  }
  const sessionToken = await createSession({ userId: user.id, role: user.role, email: user.email, deviceId: device.id, twoFactorVerified: false });
  const response = NextResponse.json({ redirect: dashboardPath(user.role), newDevice: device.isNew, loginMethod: 'password', fingerprint: meta.fingerprint });
  response.cookies.set('tp_session', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
  response.cookies.set('tp_device', deviceToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
  return response;
}
