import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueVerificationEmail } from '@/lib/verification';

const input = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  if (user.emailVerifiedAt) return NextResponse.json({ error: 'This account is already verified.' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== user.id) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { email: parsed.data.email } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
  ]);

  const baseUrl = new URL(request.url).origin;
  const { sent } = await issueVerificationEmail(user.id, parsed.data.email, baseUrl);
  return NextResponse.json({ ok: true, email: parsed.data.email, emailSent: sent });
}
