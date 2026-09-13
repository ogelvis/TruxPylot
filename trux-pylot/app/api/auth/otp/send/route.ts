import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';
import { encryptSecret, recordLoginAttempt } from '@/lib/security';
import { getSupabaseAuthUserById } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const emailField = z.string().email().transform(normalizeEmail);

const registerFields = z.object({
  mode: z.literal('register'),
  email: emailField,
  fullName: z.string().min(2),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']),
  accountType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
  businessName: z.string().max(160).optional(),
  registrationNumber: z.string().max(60).optional(),
  phone: z.string().min(7).optional(),
  country: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
  street: z.string().max(200).optional(),
  profession: z.string().max(120).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  referralCode: z.string().max(40).optional(),
  password: z.string().min(8).max(200).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
  confirmPassword: z.string().min(8).max(200),
  securityQuestion: z.string().min(5).max(200),
  securityAnswer: z.string().min(2).max(200),
  privacyAccepted: z.literal(true),
  privacyPolicyVersion: z.string().max(40),
});

const loginFields = z.object({
  mode: z.literal('login'),
  email: emailField,
});

const adminLoginFields = z.object({
  mode: z.literal('admin-login'),
  email: emailField,
});

const input = z.discriminatedUnion('mode', [registerFields, loginFields, adminLoginFields]);

/** Maps a failed sendEmailOtp() call to an HTTP status + user-facing message,
 *  while logging the real cause (env misconfig, Supabase SMTP/Resend
 *  failure, rate limit, etc.) server-side for diagnosis. */
function otpSendFailureResponse(err: unknown, context: 'register' | 'login' | 'admin-bootstrap') {
  const details = describeOtpError(err);
  console.error(`[otp/send] ${context} failed:`, details);
  if (details.status === 429) {
    return NextResponse.json({
      error: 'Too many codes requested for this email. Please wait a few minutes and try again.',
      ...(process.env.NODE_ENV !== 'production' ? { debug: details } : {}),
    }, { status: 429 });
  }
  return NextResponse.json({
    error: 'Could not send a verification code right now. Please try again shortly.',
    ...(process.env.NODE_ENV !== 'production' ? { debug: details } : {}),
  }, { status: 502 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  }
  const parsed = input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  const d = parsed.data;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const limiter = rateLimit(`otp:${d.email}:${ip}`, d.mode === 'admin-login' ? 5 : 8, 15 * 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Too many code requests. Please wait and try again.' }, {
      status: 429,
      headers: { 'Retry-After': String(limiter.retryAfter) },
    });
  }

  let existing;
  try {
    existing = await Promise.race([
      prisma.user.findUnique({ where: { email: d.email } }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Database lookup timed out')), 8000)),
    ]);
  } catch (err) {
    console.error('[otp/send] registration lookup failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'We could not check your registration right now. Please try again shortly.' }, { status: 503 });
  }

  if (d.mode === 'admin-login') {
    if (!existing || !['ADMIN', 'SUPER_ADMIN'].includes(existing.role)) {
      await recordLoginAttempt({ userId: existing?.id, email: d.email, action: 'ADMIN_LOGIN_REQUEST', success: false, riskLevel: 'HIGH', failureReason: 'UNAUTHORIZED_ADMIN_ACCESS', request }).catch(()=>{});
      return NextResponse.json({ error: 'Administrative access is not available for this account.' }, { status: 403 });
    }
    if (existing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This administrative account is not active.' }, { status: 403 });
    }
    try {
      await sendEmailOtp(d.email, { shouldCreateUser: false });
    } catch (err) {
      return otpSendFailureResponse(err, 'admin-bootstrap');
    }
    return NextResponse.json({ ok: true });
  }

  if (d.mode === 'register') {
    if (existing) {
      // A user can be removed directly from Supabase Dashboard. In that case
      // the old Prisma row would otherwise keep the email permanently locked.
      // Reconcile only when Supabase explicitly says the linked auth user is
      // missing; transient Supabase errors must never be treated as deletion.
      try {
        const authState = await getSupabaseAuthUserById(existing.id);
        if (authState.missing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              status: 'DELETED',
              deletedAt: new Date(),
              deletedEmail: existing.email,
              deletedPhone: existing.phone,
              deletedGoogleSubject: existing.googleSubject,
              email: `deleted-${existing.id}@deleted.truxpylot.invalid`,
              phone: null,
              googleSubject: null,
              suspendedUntil: null,
              suspensionReason: 'Account deleted in Supabase Auth',
            },
          });
        } else {
          return NextResponse.json({ error: 'That email is already registered. Try signing in instead.' }, { status: 409 });
        }
      } catch (err) {
        console.error('[otp/send] Supabase account reconciliation failed:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'We could not verify the status of this account right now. Please try again shortly.' }, { status: 503 });
      }
    }
    if (d.password !== d.confirmPassword) return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    if (d.accountType === 'BUSINESS' && (!d.businessName?.trim() || !d.registrationNumber?.trim())) {
      return NextResponse.json({ error: 'Business name and registration number are required for a business account.' }, { status: 400 });
    }
    const { mode: _mode, email, password, confirmPassword: _confirmPassword, securityAnswer, privacyAccepted: _privacyAccepted, ...profile } = d;
    const secureProfile = { ...profile, passwordEncrypted: encryptSecret(password), securityAnswerEncrypted: encryptSecret(securityAnswer), privacyPolicyVersion: d.privacyPolicyVersion, privacyAcceptedAt: new Date().toISOString() };
    try {
      await sendEmailOtp(email, { shouldCreateUser: true, data: secureProfile });
    } catch (err) {
      return otpSendFailureResponse(err, 'register');
    }
    return NextResponse.json({ ok: true });
  }

  // mode === 'login'
  if (!existing) { await recordLoginAttempt({ email: d.email, action: 'LOGIN_REQUEST', success: false, riskLevel: 'MEDIUM', failureReason: 'UNKNOWN_ACCOUNT', request }).catch(()=>{}); return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 }); }
  if (existing.status === 'BLOCKED') {
    return NextResponse.json({ error: 'This account has been blocked. Contact support if you believe this is a mistake.' }, { status: 403 });
  }
  if (existing.status === 'SUSPENDED' && (!existing.suspendedUntil || existing.suspendedUntil > new Date())) {
    return NextResponse.json({
      error: `This account is suspended${existing.suspendedUntil ? ` until ${existing.suspendedUntil.toLocaleDateString()}` : ''}.${existing.suspensionReason ? ` Reason: ${existing.suspensionReason}` : ''}`,
    }, { status: 403 });
  }
  try {
    await sendEmailOtp(d.email, { shouldCreateUser: false });
  } catch (err) {
    return otpSendFailureResponse(err, 'login');
  }
  return NextResponse.json({ ok: true });
}
