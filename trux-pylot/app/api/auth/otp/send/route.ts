import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';

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
});

const loginFields = z.object({
  mode: z.literal('login'),
  email: emailField,
});

const input = z.discriminatedUnion('mode', [registerFields, loginFields]);

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
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });

  if (d.mode === 'register') {
    if (existing) return NextResponse.json({ error: 'That email is already registered. Try signing in instead.' }, { status: 409 });
    if (d.accountType === 'BUSINESS' && (!d.businessName?.trim() || !d.registrationNumber?.trim())) {
      return NextResponse.json({ error: 'Business name and registration number are required for a business account.' }, { status: 400 });
    }
    const { mode: _mode, email, ...profile } = d;
    try {
      await sendEmailOtp(email, { shouldCreateUser: true, data: profile });
    } catch (err) {
      return otpSendFailureResponse(err, 'register');
    }
    return NextResponse.json({ ok: true });
  }

  // mode === 'login'
  if (!existing) return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 });
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
