import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const input = z.object({
  bankName: z.string().trim().min(2).max(120),
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().regex(/^\d{10}$/),
  bankCode: z.string().trim().min(2).max(20),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  return NextResponse.json({ account: await prisma.payoutAccount.findUnique({ where: { userId: session.userId } }) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Select a valid Nigerian bank and enter a 10-digit account number.' }, { status: 400 });

  const account = await prisma.payoutAccount.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...parsed.data, verified: false, verifiedAt: null, paystackRecipientCode: null },
    update: { ...parsed.data, verified: false, verifiedAt: null, paystackRecipientCode: null },
  });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'PAYOUT_ACCOUNT_UPDATED', entity: 'PayoutAccount', entityId: account.id } });
  return NextResponse.json({ account });
}
