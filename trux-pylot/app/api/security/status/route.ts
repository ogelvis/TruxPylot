import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const [profile, questions, devices, attempts] = await Promise.all([
    prisma.securityProfile.findUnique({ where: { userId: session.userId }, select: { twoFactorEnabled: true, securityReminderSeenAt: true, lastTwoFactorVerifiedAt: true, passwordHash: true } }),
    prisma.securityQuestion.findMany({ where: { userId: session.userId }, select: { id: true, question: true, createdAt: true }, orderBy: { createdAt: 'asc' } }),
    prisma.recognizedDevice.findMany({ where: { userId: session.userId, revokedAt: null }, select: { id: true, label: true, ipAddress: true, firstSeenAt: true, lastSeenAt: true }, orderBy: { lastSeenAt: 'desc' }, take: 10 }),
    prisma.loginAttempt.findMany({ where: { userId: session.userId }, select: { id: true, action: true, success: true, riskLevel: true, failureReason: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  return NextResponse.json({ twoFactorEnabled: Boolean(profile?.twoFactorEnabled), hasPassword: Boolean(profile?.passwordHash), securityReminderSeen: Boolean(profile?.securityReminderSeenAt), questions, devices, attempts });
}
