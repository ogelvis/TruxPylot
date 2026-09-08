import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const input = z.object({
  bankName: z.string().trim().min(2).max(120),
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().regex(/^\d{10}$/),
  bankCode: z.string().trim().max(20).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  return NextResponse.json({ account: await prisma.payoutAccount.findUnique({ where: { userId: session.userId } }) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid bank name, account name and 10-digit account number.' }, { status: 400 });
  const account = await prisma.payoutAccount.upsert({ where: { userId: session.userId }, create: { userId: session.userId, ...parsed.data }, update: { ...parsed.data, verified: false } });
  return NextResponse.json({ account });
}
