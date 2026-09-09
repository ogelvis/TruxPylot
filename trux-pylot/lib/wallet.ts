import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const MIN_WITHDRAWAL_KOBO = 100_000;

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
  if (!reference || !Number.isSafeInteger(amount) || amount <= 0) {
    return { ok: false as const, reason: 'invalid_payment' as const };
  }

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

    await tx.wallet.update({
      where: { id: funding.walletId },
      data: { availableBalance: { increment: amount } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: funding.walletId,
        type: 'CREDIT',
        source: 'FUNDING',
        amount,
        status: 'COMPLETED',
        description: 'Wallet funding',
        reference,
        metadata: providerEventId ? { providerEventId } : undefined,
      },
    });
  });

  return { ok: true as const, already: false };
}

function extractPaystackCustomerCode(data: any): string | null {
  const customer = data?.customer;
  if (typeof customer === 'string' && customer.trim()) return customer.trim();
  if (customer && typeof customer === 'object' && typeof customer.customer_code === 'string') {
    return customer.customer_code.trim() || null;
  }
  if (typeof data?.customer_code === 'string') return data.customer_code.trim() || null;
  return null;
}

function extractReceiverAccountNumber(data: any): string | null {
  const candidates = [
    data?.authorization?.receiver_bank_account_number,
    data?.receiver?.account_number,
    data?.metadata?.account_number,
  ];
  const value = candidates.find(item => typeof item === 'string' && /^\d{10}$/.test(item));
  return value ?? null;
}

/**
 * Credits a transfer received through a TruxPylot Dedicated Virtual Account.
 * Paystack identifies DVA transfers with authorization.receiver_bank_account_number.
 * The customer code is used as a second mapping key so a delayed/missing local
 * account number does not cause a valid transfer to be lost.
 */
export async function applyDedicatedAccountTransfer(event: any) {
  const data = event?.data ?? {};
  const reference = String(data.reference ?? data.id ?? '').trim();
  const providerEventId = data.id != null ? String(data.id) : undefined;
  const amount = Number(data.amount);
  const currency = typeof data.currency === 'string' ? data.currency : undefined;
  const accountNumber = extractReceiverAccountNumber(data);
  const customerCode = extractPaystackCustomerCode(data);

  if (!reference || !Number.isSafeInteger(amount) || amount <= 0) {
    return { matched: false as const, reason: 'invalid_payment' as const };
  }
  if (currency && currency.toUpperCase() !== 'NGN') {
    return { matched: false as const, reason: 'unsupported_currency' as const };
  }

  const account = accountNumber
    ? await prisma.dedicatedAccount.findFirst({ where: { accountNumber } })
    : null;
  const mappedAccount = account ?? (customerCode
    ? await prisma.dedicatedAccount.findFirst({ where: { paystackCustomerCode: customerCode } })
    : null);

  try {
    return await prisma.$transaction(async tx => {
      const existingTransfer = await tx.incomingTransfer.findUnique({ where: { reference } });
      const existingCredit = await tx.walletTransaction.findUnique({ where: { reference } });

      if (existingCredit) {
        if (existingTransfer && existingTransfer.status !== 'COMPLETED') {
          await tx.incomingTransfer.update({
            where: { id: existingTransfer.id },
            data: {
              dedicatedAccountId: mappedAccount?.id ?? existingTransfer.dedicatedAccountId,
              status: mappedAccount ? 'COMPLETED' : existingTransfer.status,
              matchedAt: mappedAccount ? existingTransfer.matchedAt ?? new Date() : existingTransfer.matchedAt,
              providerEventId: existingTransfer.providerEventId ?? providerEventId,
            },
          });
        }
        return { matched: Boolean(mappedAccount), duplicate: true as const, transferId: existingTransfer?.id };
      }

      let transfer = existingTransfer;
      if (!transfer) {
        transfer = await tx.incomingTransfer.create({
          data: {
            dedicatedAccountId: mappedAccount?.id,
            reference,
            amount,
            currency,
            providerEventId,
            status: mappedAccount ? 'COMPLETED' : 'UNMATCHED',
            payload: data,
            matchedAt: mappedAccount ? new Date() : undefined,
          },
        });
      } else if (mappedAccount) {
        transfer = await tx.incomingTransfer.update({
          where: { id: transfer.id },
          data: {
            dedicatedAccountId: mappedAccount.id,
            status: 'COMPLETED',
            matchedAt: transfer.matchedAt ?? new Date(),
            providerEventId: transfer.providerEventId ?? providerEventId,
            payload: data,
          },
        });
      }

      if (!mappedAccount) {
        console.warn('[DVA TRANSFER] unmatched', {
          reference,
          providerEventId,
          amount,
          accountNumber,
          customerCode,
        });
        return { matched: false as const, duplicate: Boolean(existingTransfer), transferId: transfer.id };
      }

      const wallet = await tx.wallet.findUnique({ where: { id: mappedAccount.walletId } });
      if (!wallet) throw new Error('DVA wallet not found');

      const professional = await tx.professional.findUnique({
        where: { id: mappedAccount.professionalId },
        select: { id: true, userId: true },
      });
      if (!professional) throw new Error('DVA professional not found');

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          source: 'DVA_TRANSFER',
          amount,
          status: 'COMPLETED',
          description: 'Bank transfer funding',
          reference,
          metadata: {
            providerEventId,
            accountNumber,
            customerCode,
            incomingTransferId: transfer.id,
          },
        },
      });

      await tx.incomingTransfer.update({
        where: { id: transfer.id },
        data: { status: 'COMPLETED', dedicatedAccountId: mappedAccount.id, matchedAt: transfer.matchedAt ?? new Date() },
      });

      await tx.notification.create({
        data: {
          userId: professional.userId,
          type: 'WALLET_DVA_CREDIT',
          title: 'Wallet funded by bank transfer',
          body: `₦${(amount / 100).toLocaleString()} has been added to your wallet.`,
          link: '/dashboard/professional/wallet',
        },
      });

      console.info('[DVA TRANSFER] wallet credited', {
        reference,
        providerEventId,
        amount,
        accountNumber,
        customerCode,
        walletId: wallet.id,
      });

      return { matched: true as const, duplicate: false as const, transferId: transfer.id, walletId: wallet.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.walletTransaction.findUnique({ where: { reference } });
      return { matched: Boolean(existing), duplicate: true as const };
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
