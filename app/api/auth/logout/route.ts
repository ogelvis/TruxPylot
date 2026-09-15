import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { recordLoginAttempt, deviceHash } from '@/lib/security';

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await writeAuditLog({ userId: session.userId, action: 'LOGOUT', entity: 'Session', data: { role: session.role } });
    const deviceToken = request.headers.get('cookie')?.match(/(?:^|;\s*)tp_device=([^;]+)/)?.[1] || null;
    await recordLoginAttempt({ userId: session.userId, email: session.email, action: 'LOGOUT', success: true, request, deviceFingerprint: deviceToken ? deviceHash(deviceToken) : undefined });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('tp_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('tp_auth_challenge', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
