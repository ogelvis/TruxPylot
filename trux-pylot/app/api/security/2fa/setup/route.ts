import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptSecret, generateRecoveryCodes, hashRecoveryCode, generateTotpSecret } from '@/lib/security';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const current = await prisma.securityProfile.findUnique({ where: { userId: session.userId }, select: { twoFactorEnabled: true } });
  if (current?.twoFactorEnabled) return NextResponse.json({ error: 'Two-step verification is already enabled.' }, { status: 409 });
  const secret = generateTotpSecret();
  const recoveryCodes = generateRecoveryCodes();
  await prisma.securityProfile.upsert({ where: { userId: session.userId }, create: { userId: session.userId, twoFactorSecretEncrypted: encryptSecret(secret), recoveryCodesHash: JSON.stringify(recoveryCodes.map(hashRecoveryCode)), twoFactorEnabled: false }, update: { twoFactorSecretEncrypted: encryptSecret(secret), recoveryCodesHash: JSON.stringify(recoveryCodes.map(hashRecoveryCode)), twoFactorEnabled: false } });
  return NextResponse.json({ secret, recoveryCodes, issuer: 'TruxPylot', account: session.email });
}
