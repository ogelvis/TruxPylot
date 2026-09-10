import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function POST() {
  const session = await getSession();
  if (session) {
    await writeAuditLog({ userId: session.userId, action: 'LOGOUT', entity: 'Session', data: { role: session.role } });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('tp_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
