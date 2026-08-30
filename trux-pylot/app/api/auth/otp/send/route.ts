import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp } from '@/lib/otp';

const registerFields = z.object({
  mode: z.literal('register'),
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']),
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
  email: z.string().email(),
});

const input = z.discriminatedUnion('mode', [registerFields, loginFields]);

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });

  if (d.mode === 'register') {
    if (existing) return NextResponse.json({ error: 'That email is already registered. Try signing in instead.' }, { status: 409 });
    const { mode: _mode, email, ...profile } = d;
    try {
      await sendEmailOtp(email, { shouldCreateUser: true, data: profile });
    } catch (err) {
      console.error('[otp/send] register failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ error: 'Could not send a verification code right now. Please try again shortly.' }, { status: 502 });
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
    console.error('[otp/send] login failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not send a sign-in code right now. Please try again shortly.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
