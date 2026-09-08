import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const MIN_WITHDRAWAL_KOBO = 200_000;

export function walletReference(prefix = 'WALLET') {
  return `TP-${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
}

export async function getProfessionalWallet(userId: string) {
  const professional = await prisma.professional.findUnique({ where: { userId }, select: { id: true } });
  if (!professional) return null;
  return prisma.wallet.upsert({
    where: { professionalId: professional.id },
    create: { professionalId: professional.id },
    update: {},
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 100 } },
  });
}

export async function applyWalletFunding(reference: string, amount: number, providerEventId?: string) {
  const funding = await prisma.walletFunding.findUnique({ where: { reference } });
  if (!funding) return { ok: false as const, reason: 'not_found' as const };
  if (funding.status === 'SUCCESS') return { ok: true as const, already: true };
  if (funding.amount !== amount) return { ok: false as const, reason: 'amount_mismatch' as const };
  await prisma.$transaction(async tx => {
    const updated = await tx.walletFunding.updateMany({
      where: { id: funding.id, status: 'PENDING' },
      data: { status: 'SUCCESS', providerEventId },
    });
    if (!updated.count) return;
    await tx.wallet.update({ where: { id: funding.walletId }, data: { availableBalance: { increment: amount } } });
    await tx.walletTransaction.create({
      data: { walletId: funding.walletId, type: 'CREDIT', source: 'FUNDING', amount, status: 'COMPLETED', description: 'Wallet funding', reference },
    });
  });
  return { ok: true as const, already: false };
}

export async function applyDedicatedAccountTransfer(event: any) {
  const data = event?.data ?? {};
  const accountNumber = data.authorization?.account_number ?? data.receiver?.account_number ?? data.metadata?.account_number;
  const customerCode = typeof data.customer === 'object' ? data.customer?.customer_code : data.customer?.customer_code ?? data.customer;
  const account = accountNumber ? await prisma.dedicatedAccount.findFirst({ where: { accountNumber } }) : customerCode ? await prisma.dedicatedAccount.findFirst({ where: { paystackCustomerCode: customerCode } }) : null;
  const reference = String(data.reference ?? data.id ?? '');
  const amount = Number(data.amount);
  if (!reference || !Number.isSafeInteger(amount) || amount <= 0) return { matched: false };
  try {
    return await prisma.$transaction(async tx => {
      const transfer = await tx.incomingTransfer.create({
        data: {
          dedicatedAccountId: account?.id,
          reference,
          amount,
          currency: data.currency,
          providerEventId: data.id ? String(data.id) : undefined,
          status: account ? 'MATCHED' : 'UNMATCHED',
          payload: data,
          matchedAt: account ? new Date() : undefined,
        },
      });
      if (!account) return { matched: false, duplicate: false };
    const wallet = await tx.wallet.findUnique({ where: { id: account.walletId } });
    if (!wallet) throw new Error('DVA wallet not found');
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: amount } } });
    await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'CREDIT', source: 'DVA_TRANSFER', amount, description: 'Bank transfer funding', reference } });
    const professional = await tx.professional.findUnique({ where: { id: account.professionalId }, select: { userId: true } });
    if (professional) await tx.notification.create({ data: { userId: professional.userId, type: 'WALLET_DVA_CREDIT', title: 'Wallet funded by bank transfer', body: `₦${(amount / 100).toLocaleString()} has been added to your wallet.`, link: '/dashboard/professional/wallet' } });
      return { matched: true, duplicate: false, transferId: transfer.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { matched: Boolean(account), duplicate: true };
    }
    throw error;
  }
}

/** Credits an approved referral reward exactly once. The unique reference is
 * created before the balance increment, so concurrent retries cannot double
 * credit. Customers without a professional profile retain the existing
 * referral-ledger semantics and simply have no professional wallet. */
export async function creditReferralReward(tx: Prisma.TransactionClient, rewardId: string) {
  const reward = await tx.reward.findUnique({ where: { id: rewardId }, select: { id: true, userId: true, amount: true, status: true } });
  if (!reward || (reward.status !== 'APPROVED' && reward.status !== 'PAID')) return false;
  const professional = await tx.professional.findUnique({ where: { userId: reward.userId }, select: { id: true } });
  if (!professional) return false;
  const wallet = await tx.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
  const inserted = await tx.walletTransaction.createMany({
    data: { walletId: wallet.id, type: 'CREDIT', source: 'REFERRAL_REWARD', status: 'COMPLETED', amount: reward.amount, description: `Referral reward ${reward.id}`, reference: `REWARD-${reward.id}` },
    skipDuplicates: true,
  });
  if (inserted.count) await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: reward.amount } } });
  return inserted.count > 0;
}
