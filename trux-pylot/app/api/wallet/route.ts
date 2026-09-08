import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getProfessionalWallet, MIN_WITHDRAWAL_KOBO } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';

const withdrawal = z.object({
  amount: z.number().int().min(MIN_WITHDRAWAL_KOBO),
  bankName: z.string().trim().min(2).max(120),
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().regex(/^\d{10}$/),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const wallet = await getProfessionalWallet(session.userId);
  if (!wallet) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
  return NextResponse.json({ ...wallet, minWithdrawal: MIN_WITHDRAWAL_KOBO });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = withdrawal.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Amount must be at least ₦2,000 and bank details are required.' }, { status: 400 });
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!professional) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
  const wallet = await prisma.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
  const item = await prisma.$transaction(async tx => {
    const current = await tx.wallet.findUnique({ where: { id: wallet.id } });
    if (!current || current.availableBalance < parsed.data.amount) throw new Error('INSUFFICIENT_BALANCE');
    const withdrawal = await tx.withdrawal.create({ data: { userId: session.userId, ...parsed.data } });
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: parsed.data.amount } } });
    await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'DEBIT', source: 'WITHDRAWAL', amount: parsed.data.amount, status: 'PENDING', description: 'Withdrawal requested', metadata: { withdrawalId: withdrawal.id } } });
    return withdrawal;
  }).catch(error => error instanceof Error && error.message === 'INSUFFICIENT_BALANCE' ? null : Promise.reject(error));
  if (!item) return NextResponse.json({ error: 'Insufficient available balance.' }, { status: 400 });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'WALLET_WITHDRAWAL_REQUESTED', entity: 'Withdrawal', entityId: item.id } });
  return NextResponse.json({ ok: true, withdrawal: item }, { status: 201 });
}
