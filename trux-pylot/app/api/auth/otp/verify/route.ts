import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';
import { createSession, dashboardPath } from '@/lib/auth';
import type { Role } from '@prisma/client';

const input = z.object({ email: z.string().email().transform(normalizeEmail), code: z.string().min(4).max(10) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
  const { email, code } = parsed.data;

  let authUser;
  try {
    authUser = await verifyEmailOtp(email, code.trim());
  } catch (err) {
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

    try {
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          email: verifiedEmail,
          role,
          phone: (meta.phone as string | undefined) || undefined,
          customer: role === 'CUSTOMER' ? {
            create: {
              fullName,
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

  const token = await createSession({ userId: user.id, role: user.role, email: user.email });
  const response = NextResponse.json({ redirect: dashboardPath(user.role) });
  response.cookies.set('tp_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
  return response;
}
