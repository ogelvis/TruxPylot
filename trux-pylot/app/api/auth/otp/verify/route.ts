import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';
import { createSession, createAuthChallenge, dashboardPath } from '@/lib/auth';
import { createDeviceToken, ensureDevice, deviceHash, getClientMeta, maybeSuspendAfterFailures, recordLoginAttempt, decryptSecret, hashPassword, hashSecurityAnswer } from '@/lib/security';
import type { Role } from '@prisma/client';
import { attributeReferral } from '@/lib/referrals';
import { rateLimit } from '@/lib/rate-limit';
import { writeAuditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import { sendNotificationEmail } from '@/lib/email';

const input = z.object({ email: z.string().email().transform(normalizeEmail), code: z.string().min(4).max(10) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
  const { email, code } = parsed.data;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const limiter = rateLimit(`otp-verify:${email}:${ip}`, 8, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Too many verification attempts. Please wait and request a new code.' }, {
      status: 429,
      headers: { 'Retry-After': String(limiter.retryAfter) },
    });
  }

  let authUser;
  try {
    authUser = await verifyEmailOtp(email, code.trim());
  } catch (err) {
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } }).catch(() => null);
    await recordLoginAttempt({ userId: existingUser?.id, email, action: 'LOGIN_OTP_VERIFY', success: false, riskLevel: 'MEDIUM', failureReason: 'INVALID_OR_EXPIRED_CODE', request });
    if (existingUser) await maybeSuspendAfterFailures(existingUser.id, existingUser.email, request).catch(error => console.error('[security] suspension check failed', error));
    console.error('[otp/verify] failed:', describeOtpError(err));
    return NextResponse.json({ error: 'That code is invalid or has expired. Request a new one.' }, { status: 400 });
  }

  // Prefer the email Supabase confirms on the authenticated user over the
  // one the client sent — it's the source of truth for who actually proved
  // ownership of the inbox that received the code.
  const verifiedEmail = authUser.email ? normalizeEmail(authUser.email) : email;
  let user = await prisma.user.findUnique({ where: { email: verifiedEmail } });

  if (!user) {
    // First-time verification — this completes registration using the
    // profile fields we stashed in the Supabase user's metadata when the
    // code was sent (see app/api/auth/otp/send).
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const role = meta.role as Role | undefined;
    const fullName = meta.fullName as string | undefined;
    if (!role || !fullName) {
      return NextResponse.json({ error: 'We could not find your registration details. Please register again.' }, { status: 400 });
    }
    const location = [meta.area, meta.city, meta.state].filter(Boolean).join(', ') || undefined;
    const accountType = (meta.accountType as 'INDIVIDUAL' | 'BUSINESS' | undefined) ?? 'INDIVIDUAL';
    const businessName = meta.businessName as string | undefined;
    const registrationNumber = meta.registrationNumber as string | undefined;

    try {
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          email: verifiedEmail,
          role,
          privacyPolicyVersion: typeof meta.privacyPolicyVersion === 'string' ? meta.privacyPolicyVersion : null,
          privacyAcceptedAt: typeof meta.privacyAcceptedAt === 'string' ? new Date(meta.privacyAcceptedAt) : null,
          phone: (meta.phone as string | undefined) || undefined,
          customer: role === 'CUSTOMER' ? {
            create: {
              fullName,
              accountType,
              businessName,
              registrationNumber,
              country: meta.country as string | undefined,
              state: meta.state as string | undefined,
              city: meta.city as string | undefined,
              area: meta.area as string | undefined,
              street: meta.street as string | undefined,
              location,
            },
          } : undefined,
          professional: role === 'PROFESSIONAL' ? {
            create: {
              fullName,
              accountType,
              businessName,
              registrationNumber,
              country: meta.country as string | undefined,
              state: meta.state as string | undefined,
              city: meta.city as string | undefined,
              area: meta.area as string | undefined,
              street: meta.street as string | undefined,
              location,
              profession: meta.profession as string | undefined,
              yearsExperience: meta.yearsExperience as number | undefined,
            },
          } : undefined,
        },
      });
      const encryptedPassword = typeof meta.passwordEncrypted === 'string' ? meta.passwordEncrypted : null;
      const encryptedAnswer = typeof meta.securityAnswerEncrypted === 'string' ? meta.securityAnswerEncrypted : null;
      if (encryptedPassword && encryptedAnswer) {
        await prisma.securityProfile.create({ data: { userId: user.id, passwordHash: hashPassword(decryptSecret(encryptedPassword)), securityReminderSeenAt: null } });
        await prisma.securityQuestion.create({ data: { userId: user.id, question: String(meta.securityQuestion || 'What was the name of your first pet?'), answerHash: hashSecurityAnswer(decryptSecret(encryptedAnswer)) } });
        await writeAuditLog({ userId: user.id, action: 'PRIVACY_POLICY_ACCEPTED', entity: 'PrivacyPolicy', entityId: user.id, data: { version: String(meta.privacyPolicyVersion || 'unknown'), acceptedAt: String(meta.privacyAcceptedAt || '') } });
      }
    } catch (err) {
      // Prisma unique-constraint violation (P2002) — most commonly the
      // phone number (or, less likely, the email/id) already belongs to
      // another account. The Supabase OTP was already consumed by the
      // time we get here, so we can't silently retry — surface exactly
      // what conflicted instead of a generic crash, so the person isn't
      // misled into thinking their code was wrong.
      const prismaErr = err as { code?: string; meta?: { target?: string[] } };
      if (prismaErr.code === 'P2002') {
        const target = prismaErr.meta?.target?.join(', ') ?? 'a field on your account';
        console.error('[otp/verify] unique constraint on create:', target);
        return NextResponse.json({
          error: target.includes('phone')
            ? 'That phone number is already registered to another account. Use a different number, or contact support if this is your number.'
            : `An account with that ${target} already exists. Try signing in instead, or contact support.`,
        }, { status: 409 });
      }
      console.error('[otp/verify] user creation failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ error: 'Could not finish creating your account. Please try registering again.' }, { status: 500 });
    }

    if (role === 'ADMIN') {
      await prisma.auditLog.create({
        data: { userId: user.id, action: 'BOOTSTRAP_ADMIN_CREATED', entity: 'User', entityId: user.id },
      });
    }
    if (typeof meta.referralCode === 'string' && meta.referralCode) {
      await attributeReferral(meta.referralCode, user.id, { role, email: verifiedEmail }).catch(error =>
        console.error('[otp/verify] referral attribution failed:', error instanceof Error ? error.message : error),
      );
    }
  } else {
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: 'This account has been blocked. Contact support if you believe this is a mistake.' }, { status: 403 });
    }
    if (user.status === 'SUSPENDED' && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
      return NextResponse.json({
        error: `This account is suspended${user.suspendedUntil ? ` until ${user.suspendedUntil.toLocaleDateString()}` : ''}.${user.suspensionReason ? ` Reason: ${user.suspensionReason}` : ''}`,
      }, { status: 403 });
    }
  }

  if (user.status === 'BLOCKED' || (user.status === 'SUSPENDED' && (!user.suspendedUntil || user.suspendedUntil > new Date()))) {
    return NextResponse.json({ error: 'This account is not currently allowed to sign in.' }, { status: 403 });
  }

  const meta = getClientMeta(request);
  let deviceToken = request.headers.get('x-truxpylot-device') || null;
  const deviceCookie = request.headers.get('cookie')?.match(/(?:^|;\s*)tp_device=([^;]+)/)?.[1] || null;
  deviceToken = deviceToken || deviceCookie;
  if (!deviceToken) deviceToken = createDeviceToken();
  const device = await ensureDevice(user.id, deviceToken, request);
  await recordLoginAttempt({ userId: user.id, email: user.email, action: 'LOGIN_SUCCESS', success: true, riskLevel: device.isNew ? 'MEDIUM' : 'NORMAL', request, deviceFingerprint: deviceHash(deviceToken), metadata: { deviceId: device.id, isNewDevice: device.isNew } });
  if (device.isNew) { await notifyUser({ userId: user.id, type: 'SECURITY_NEW_DEVICE', title: 'New device signed in', body: 'A new device was used to sign in to your TruxPylot account. If this was not you, secure your account immediately.', link: '/dashboard/' + (user.role === 'PROFESSIONAL' ? 'professional/settings' : user.role === 'CUSTOMER' ? 'customer/settings' : 'admin/security') }).catch(()=>{}); try { await sendNotificationEmail({ to: user.email, subject: 'New TruxPylot sign-in', title: 'New device signed in', body: 'A new device was used to sign in to your TruxPylot account. If this was not you, review your account security immediately.' }); } catch {} }
  const security = await prisma.securityProfile.findUnique({ where: { userId: user.id }, select: { twoFactorEnabled: true } });
  if (security?.twoFactorEnabled) {
    const challenge = await createAuthChallenge({ userId: user.id, role: user.role, email: user.email, purpose: 'LOGIN_2FA' });
    const response = NextResponse.json({ requires2FA: true, reason: '2FA', redirect: dashboardPath(user.role) });
    response.cookies.set('tp_auth_challenge', challenge, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    response.cookies.set('tp_device', deviceToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
    return response;
  }
  const token = await createSession({ userId: user.id, role: user.role, email: user.email, deviceId: device.id, twoFactorVerified: false });
  await writeAuditLog({ userId: user.id, action: 'LOGIN', entity: 'Session', data: { role: user.role, newDevice: device.isNew } });
  const response = NextResponse.json({ redirect: dashboardPath(user.role), newDevice: device.isNew });
  response.cookies.set('tp_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
  response.cookies.set('tp_device', deviceToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
  return response;
}
