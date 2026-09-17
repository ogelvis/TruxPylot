import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getProfessionalWallet, MIN_WITHDRAWAL_KOBO, applyWalletFunding } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';
import { getOrCreateDedicatedAccount, reconcileRecentDedicatedTransfers } from '@/lib/dedicated-account';

const withdrawal = z.object({ amount: z.number().int().min(MIN_WITHDRAWAL_KOBO) });

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const wallet = await getProfessionalWallet(session.userId);
  if (!wallet) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });

  // Reconcile recent checkout fundings directly with Paystack as a fallback
  // when the webhook is delayed. Webhook processing remains the primary path.
  const sync = new URL(request.url).searchParams.get('sync') === '1';
  if (sync && process.env.PAYSTACK_SECRET_KEY) {
    const pendingFundings = await prisma.walletFunding.findMany({
      where: { walletId: wallet.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    for (const funding of pendingFundings) {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(funding.reference)}`, {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
          cache: 'no-store',
        });
        const body = await response.json().catch(() => null);
        if (response.ok && body?.data?.status === 'success') {
          await applyWalletFunding(funding.reference, Number(body.data.amount), String(body.data.id));
        }
      } catch (error) {
        console.warn('[WALLET SYNC] Paystack verification failed', { reference: funding.reference, error: error instanceof Error ? error.message : 'unknown' });
      }
    }

    // Also reconcile recent DVA transfers directly from Paystack. This is a
    // webhook fallback: if Paystack has already created the transfer but the
    // webhook is delayed, the transaction can still be credited safely.
    try {
      const dedicatedAccount = await prisma.dedicatedAccount.findUnique({ where: { walletId: wallet.id } });
      if (dedicatedAccount) {
        await reconcileRecentDedicatedTransfers(dedicatedAccount.id);
      } else {
        // Provision/sync the DVA if this wallet has never loaded its bank
        // transfer account. This is deliberately non-requerying; DVA requery
        // is rate-limited by Paystack and is still triggered by the explicit
        // transfer-check action when needed.
        await getOrCreateDedicatedAccount(session.userId, true, false);
      }
    } catch (error) {
      console.warn('[WALLET SYNC] DVA reconciliation failed', { error: error instanceof Error ? error.message : 'unknown' });
    }
  }
  const freshWallet = sync ? await getProfessionalWallet(session.userId) : wallet;
  const [withdrawals, payoutAccount, earned] = await Promise.all([
    prisma.withdrawal.findMany({ where: { userId: session.userId, source: 'WALLET' }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.payoutAccount.findUnique({ where: { userId: session.userId } }),
    prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, type: 'CREDIT', status: 'COMPLETED', source: { in: ['JOB_EARNING', 'REFERRAL_REWARD', 'ADJUSTMENT'] } },
      _sum: { amount: true },
    }),
  ]);
  const withdrawn = withdrawals.filter(item => item.status !== 'REJECTED').reduce((sum, item) => sum + item.amount, 0);
  return NextResponse.json({ ...freshWallet, totalEarned: earned._sum.amount ?? 0, totalWithdrawn: withdrawn, withdrawals, payoutAccount, minWithdrawal: MIN_WITHDRAWAL_KOBO }, { headers: { 'Cache-Control': 'private, no-store' } });
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
      await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'DEBIT', source: 'WITHDRAWAL', amount: parsed.data.amount, status: 'PENDING', description: 'Withdrawal requested — awaiting admin review', reference: `WD-${withdrawal.id}`, metadata: { withdrawalId: withdrawal.id, source: 'WALLET' } } });
      return withdrawal;
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'WALLET_WITHDRAWAL_REQUESTED', entity: 'Withdrawal', entityId: item.id, data: { amount: item.amount, status: item.status } } });
    return NextResponse.json({ ok: true, withdrawal: item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') return NextResponse.json({ error: 'Insufficient available balance.' }, { status: 400 });
    throw error;
  }
}
