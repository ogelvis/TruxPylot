import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { decryptSecret, verifyTotp } from '@/lib/security';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Administrative accounts must keep 2-step verification enabled.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const profile = await prisma.securityProfile.findUnique({ where: { userId: session.userId } });
  let valid=false;try{valid=Boolean(profile?.twoFactorSecretEncrypted)&&verifyTotp(decryptSecret(profile!.twoFactorSecretEncrypted!),String(body?.code||''))}catch{} if (!valid) return NextResponse.json({ error: 'Current authenticator code is required.' }, { status: 400 });
  await prisma.securityProfile.update({ where: { userId: session.userId }, data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null, recoveryCodesHash: null } });
  await writeAuditLog({userId:session.userId,action:'TWO_FACTOR_DISABLED',entity:'SecurityProfile',entityId:session.userId});
  return NextResponse.json({ ok: true });
}
