import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/verification';
import { createSession, dashboardPath } from '@/lib/auth';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/login?verify=missing', request.url));

  const userId = await consumeVerificationToken(token);
  if (!userId) return NextResponse.redirect(new URL('/login?verify=invalid', request.url));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.redirect(new URL('/login?verify=invalid', request.url));

  const sessionToken = await createSession({ userId: user.id, role: user.role, email: user.email });
  const response = NextResponse.redirect(new URL(`${dashboardPath(user.role)}?verified=1`, request.url));
  response.cookies.set('tp_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
  return response;
}
