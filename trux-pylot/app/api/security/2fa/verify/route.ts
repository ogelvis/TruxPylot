import { NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { decryptSecret, verifyTotp } from '@/lib/security';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').trim();
  const profile = await prisma.securityProfile.findUnique({ where: { userId: session.userId } });
  if (!profile?.twoFactorSecretEncrypted) return NextResponse.json({ error: 'Start two-step verification setup first.' }, { status: 400 });
  let valid = false;
  try { valid = verifyTotp(decryptSecret(profile.twoFactorSecretEncrypted), code); } catch {}
  if (!valid) return NextResponse.json({ error: 'That authenticator code is invalid.' }, { status: 400 });
  await prisma.securityProfile.update({ where: { userId: session.userId }, data: { twoFactorEnabled: true, lastTwoFactorVerifiedAt: new Date() } });
  const sessionToken = await createSession({ userId: session.userId, role: session.role, email: session.email, deviceId: session.deviceId, twoFactorVerified: true });
  const response = NextResponse.json({ ok: true });
  response.cookies.set('tp_session', sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
  await writeAuditLog({userId:session.userId,action:'TWO_FACTOR_ENABLED',entity:'SecurityProfile',entityId:session.userId});
  return response;
}
