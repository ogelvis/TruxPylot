import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, dashboardPath } from '@/lib/auth';
import { readPhoneTicket } from '@/lib/twilio-verify';

const input = z.object({ phone: z.string().min(7), ticket: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Missing phone or verification ticket.' }, { status: 400 });

  const verifiedPhone = await readPhoneTicket(parsed.data.ticket);
  if (!verifiedPhone || verifiedPhone !== parsed.data.phone) {
    return NextResponse.json({ error: 'Phone verification expired. Request a new code and try again.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { phone: verifiedPhone } });
  if (!user) return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 404 });

  if (user.status === 'BLOCKED') {
    return NextResponse.json({ error: 'This account has been blocked. Contact support if you believe this is a mistake.' }, { status: 403 });
  }
  if (user.status === 'SUSPENDED' && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
    return NextResponse.json(
      { error: `This account is suspended${user.suspendedUntil ? ` until ${user.suspendedUntil.toLocaleDateString()}` : ''}.${user.suspensionReason ? ` Reason: ${user.suspensionReason}` : ''}` },
      { status: 403 },
    );
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
