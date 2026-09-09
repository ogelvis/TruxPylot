import { prisma } from '@/lib/prisma';
import {
  initiateTransfer,
  finalizeTransfer,
  withdrawalProviderReference,
} from '@/lib/paystack-transfers';

export async function processWalletWithdrawal(
  withdrawalId: string,
  adminUserId: string
) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!withdrawal || withdrawal.source !== 'WALLET') {
    throw new Error('Wallet withdrawal not found.');
  }

  if (withdrawal.status !== 'REQUESTED') {
    throw new Error('Withdrawal is not awaiting review.');
  }

  if (
    !withdrawal.bankName ||
    !withdrawal.accountName ||
    !withdrawal.accountNumber
  ) {
    throw new Error('Withdrawal has incomplete payout details.');
  }

  const payout = await prisma.payoutAccount.findUnique({
    where: { userId: withdrawal.userId },
  });

  if (!payout || !payout.verified || !payout.paystackRecipientCode) {
    throw new Error('User payout account is not verified.');
  }

  const providerReference =
    withdrawal.providerReference ??
    withdrawalProviderReference(withdrawal.id);

  await prisma.withdrawal.update({
    where: { id: withdrawal.id },
    data: {
      status: 'REVIEWING',
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      providerReference,
      providerStatus: 'reviewing',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'WALLET_WITHDRAWAL_APPROVED_FOR_PROCESSING',
      entity: 'Withdrawal',
      entityId: withdrawal.id,
      data: {
        amount: withdrawal.amount,
        providerReference,
      },
    },
  });

  try {
    const transfer = await initiateTransfer({
      amount: withdrawal.amount,
      recipientCode: payout.paystackRecipientCode,
      reference: providerReference,
      reason: `TruxPylot wallet withdrawal ${withdrawal.id}`,
    });

    const status = String(transfer.status ?? '').toLowerCase();

    if (status === 'success') {
      await markWithdrawalSuccessful(
        withdrawal.id,
        transfer.id,
        transfer.transfer_code,
        status
      );

      return {
        status: 'PAID' as const,
        transfer,
      };
    }

    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'APPROVED',
        providerTransferId: String(transfer.id),
        providerTransferCode: transfer.transfer_code ?? null,
        providerStatus: status || 'pending',
        providerError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'WALLET_WITHDRAWAL_SENT_TO_PAYSTACK',
        entity: 'Withdrawal',
        entityId: withdrawal.id,
        data: {
          providerReference,
          providerTransferId: transfer.id,
          providerStatus: status,
        },
      },
    });

    return {
      status: 'APPROVED' as const,
      transfer,
      needsOtp: status === 'otp',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Paystack transfer failed.';

    await markWithdrawalFailed(
      withdrawal.id,
      message,
      adminUserId
    );

    throw new Error(message);
  }
}

export async function finalizeWalletWithdrawal(
  withdrawalId: string,
  otp: string,
  adminUserId: string
) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal || withdrawal.source !== 'WALLET') {
    throw new Error('Wallet withdrawal not found.');
  }

  if (!withdrawal.providerTransferCode) {
    throw new Error(
      'This withdrawal does not require an OTP finalization.'
    );
  }

  if (!['APPROVED', 'REVIEWING'].includes(withdrawal.status)) {
    throw new Error(
      'Withdrawal is not awaiting finalization.'
    );
  }

  const transfer = await finalizeTransfer(
    withdrawal.providerTransferCode,
    otp
  );

  const status = String(transfer.status ?? '').toLowerCase();

  if (status === 'success') {
    await markWithdrawalSuccessful(
      withdrawal.id,
      transfer.id,
      transfer.transfer_code,
      status
    );

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'WALLET_WITHDRAWAL_FINALIZED',
        entity: 'Withdrawal',
        entityId: withdrawal.id,
        data: {
          providerTransferId: transfer.id,
        },
      },
    });

    return {
      status: 'PAID' as const,
      transfer,
    };
  }

  await prisma.withdrawal.update({
    where: { id: withdrawal.id },
    data: {
      status: 'APPROVED',
      providerTransferId: String(transfer.id),
      providerStatus: status,
      providerError: null,
    },
  });

  return {
    status: 'APPROVED' as const,
    transfer,
  };
}

export async function markWithdrawalSuccessful(
  withdrawalId: string,
  providerTransferId?: number | string,
  transferCode?: string,
  providerStatus = 'success'
) {
  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found.');
    }

    if (withdrawal.status === 'PAID') {
      return;
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        providerStatus,
        providerTransferId:
          providerTransferId != null
            ? String(providerTransferId)
            : withdrawal.providerTransferId,
        providerTransferCode:
          transferCode ?? withdrawal.providerTransferCode,
        providerError: null,
      },
    });

    const transaction = await tx.walletTransaction.findUnique({
      where: {
        reference: `WD-${withdrawal.id}`,
      },
    });

    if (transaction) {
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          description: 'Withdrawal paid to bank account',
          metadata: {
            withdrawalId: withdrawal.id,
            providerTransferId,
            providerStatus,
          },
        },
      });
    }
  });
}

export async function markWithdrawalFailed(
  withdrawalId: string,
  reason: string,
  adminUserId?: string,
  reversed = false
) {
  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (
      !withdrawal ||
      ['PAID', 'REJECTED', 'FAILED'].includes(withdrawal.status)
    ) {
      return;
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'FAILED',
        rejectionReason: reason,
        providerError: reason,
        reviewedById:
          adminUserId ?? withdrawal.reviewedById,
        reviewedAt:
          withdrawal.reviewedAt ?? new Date(),
      },
    });

    const transaction = await tx.walletTransaction.findUnique({
      where: {
        reference: `WD-${withdrawal.id}`,
      },
    });

    if (
      transaction &&
      transaction.status !== 'REVERSED'
    ) {
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: reversed
            ? 'REVERSED'
            : 'FAILED',
          description: reversed
            ? 'Withdrawal reversed — funds returned'
            : 'Withdrawal failed — funds returned',
          metadata: {
            withdrawalId: withdrawal.id,
            reason,
          },
        },
      });
    }

    if (
      withdrawal.source === 'WALLET' &&
      transaction
    ) {
      await tx.wallet.update({
        where: {
          id: transaction.walletId,
        },
        data: {
          availableBalance: {
            increment: withdrawal.amount,
          },
        },
      });
    }
  });
}

export async function rejectWalletWithdrawal(
  withdrawalId: string,
  adminUserId: string,
  reason: string
) {
  if (!reason.trim()) {
    throw new Error(
      'A rejection reason is required.'
    );
  }

  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (
      !withdrawal ||
      withdrawal.source !== 'WALLET'
    ) {
      throw new Error(
        'Wallet withdrawal not found.'
      );
    }

    if (
      !['REQUESTED', 'REVIEWING'].includes(
        withdrawal.status
      )
    ) {
      throw new Error(
        'Withdrawal cannot be rejected in its current state.'
      );
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });

    const transaction = await tx.walletTransaction.findUnique({
      where: {
        reference: `WD-${withdrawal.id}`,
      },
    });

    if (
      transaction &&
      transaction.status !== 'REVERSED'
    ) {
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REVERSED',
          description:
            'Withdrawal rejected — funds returned',
          metadata: {
            withdrawalId: withdrawal.id,
            reason: reason.trim(),
          },
        },
      });

      await tx.wallet.update({
        where: {
          id: transaction.walletId,
        },
        data: {
          availableBalance: {
            increment: withdrawal.amount,
          },
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'WALLET_WITHDRAWAL_REJECTED',
      entity: 'Withdrawal',
      entityId: withdrawalId,
      data: {
        reason: reason.trim(),
      },
    },
  });
}
