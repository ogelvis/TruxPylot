import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getProfessionalWallet, MIN_WITHDRAWAL_KOBO } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';
import { processWalletWithdrawal } from '@/lib/withdrawals';

const withdrawal = z.object({ amount: z.number().int().min(MIN_WITHDRAWAL_KOBO) });

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const wallet = await getProfessionalWallet(session.userId);
  if (!wallet) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
  const [withdrawals, payoutAccount, earned] = await Promise.all([
    prisma.withdrawal.findMany({ where: { userId: session.userId, source: 'WALLET' }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.payoutAccount.findUnique({ where: { userId: session.userId } }),
    prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, type: 'CREDIT', status: 'COMPLETED', source: { in: ['JOB_EARNING', 'REFERRAL_REWARD', 'ADJUSTMENT'] } },
      _sum: { amount: true },
    }),
  ]);
  const withdrawn = withdrawals.filter(item => item.status !== 'REJECTED').reduce((sum, item) => sum + item.amount, 0);
  return NextResponse.json({ ...wallet, totalEarned: earned._sum.amount ?? 0, totalWithdrawn: withdrawn, withdrawals, payoutAccount, minWithdrawal: MIN_WITHDRAWAL_KOBO }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = withdrawal.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Minimum withdrawal is ₦200.' }, { status: 400 });

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!professional) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
  const payout = await prisma.payoutAccount.findUnique({ where: { userId: session.userId } });
  if (!payout || !payout.verified || !payout.paystackRecipientCode) return NextResponse.json({ error: 'Verify your payout bank account before requesting a withdrawal.' }, { status: 400 });

  const wallet = await prisma.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim().slice(0, 120) || null;
  if (idempotencyKey) {
    const existing = await prisma.withdrawal.findUnique({ where: { idempotencyKey } });
    if (existing) return NextResponse.json({ ok: true, withdrawal: existing, replayed: true });
  }

  try {
    const item = await prisma.$transaction(async tx => {
      const current = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!current || current.availableBalance < parsed.data.amount) throw new Error('INSUFFICIENT_BALANCE');
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: session.userId,
          source: 'WALLET',
          idempotencyKey,
          amount: parsed.data.amount,
          bankName: payout.bankName,
          accountName: payout.accountName,
          accountNumber: payout.accountNumber,
          status: 'REQUESTED',
        },
      });
      await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: parsed.data.amount } } });
      await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'DEBIT', source: 'WITHDRAWAL', amount: parsed.data.amount, status: 'PENDING', description: 'Withdrawal requested — sent to Paystack for processing', reference: `WD-${withdrawal.id}`, metadata: { withdrawalId: withdrawal.id, source: 'WALLET' } } });
      return withdrawal;
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'WALLET_WITHDRAWAL_REQUESTED', entity: 'Withdrawal', entityId: item.id, data: { amount: item.amount, status: item.status, automaticProcessing: true } } });

    // Automatically send the payout to Paystack after the wallet reservation
    // succeeds. The server remains the source of truth and Paystack webhooks
    // finalize the final status. If Paystack requires OTP, the withdrawal is
    // kept in APPROVED/otp instead of being lost.
    try {
      const result = await processWalletWithdrawal(item.id, session.userId);
      return NextResponse.json({ ok: true, withdrawal: result }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Withdrawal could not be sent to Paystack.' }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') return NextResponse.json({ error: 'Insufficient available balance.' }, { status: 400 });
    throw error;
  }
}
