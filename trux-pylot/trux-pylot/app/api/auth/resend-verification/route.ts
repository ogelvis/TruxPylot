import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueVerificationEmail } from '@/lib/verification';

const COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  if (user.emailVerifiedAt) return NextResponse.json({ error: 'This email is already verified.' }, { status: 400 });

  const lastToken = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (lastToken && Date.now() - lastToken.createdAt.getTime() < COOLDOWN_MS) {
    return NextResponse.json({ error: 'Please wait a moment before requesting another email.' }, { status: 429 });
  }

  const baseUrl = new URL(request.url).origin;
  const { sent } = await issueVerificationEmail(user.id, user.email, baseUrl);
  return NextResponse.json({ ok: true, emailSent: sent });
}
