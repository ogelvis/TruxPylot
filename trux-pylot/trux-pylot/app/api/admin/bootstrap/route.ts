import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';

const input = z.object({
  secret: z.string().min(1),
  email: z.string().email().transform(normalizeEmail),
  fullName: z.string().min(2).max(120).optional(),
});

// One-time use: this route only ever works while zero ADMIN accounts exist.
// It sends an email OTP the same way regular sign-up does — completing the
// admin account happens via the normal POST /api/auth/otp/verify endpoint
// using the 6-digit code that arrives by email.
export async function POST(request: Request) {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Bootstrap is not configured on this server.' }, { status: 503 });
  }

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please provide a valid secret and email.' }, { status: 400 });
  }
  if (parsed.data.secret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    return NextResponse.json({ error: 'An admin account already exists. This endpoint is now permanently disabled.' }, { status: 409 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail) {
    return NextResponse.json({ error: 'That email is already registered to a non-admin account.' }, { status: 409 });
  }

  try {
    await sendEmailOtp(parsed.data.email, {
      shouldCreateUser: true,
      data: { role: 'ADMIN', fullName: parsed.data.fullName || 'Admin' },
    });
  } catch (err) {
    const details = describeOtpError(err);
    console.error('[admin/bootstrap] send failed:', details);
    return NextResponse.json({
      error: 'Could not send a verification code right now. Please try again shortly.',
      ...(process.env.NODE_ENV !== 'production' ? { debug: details } : {}),
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Code sent. Finish setup by POSTing { email, code } to /api/auth/otp/verify with the 6-digit code from that email.',
  });
}
