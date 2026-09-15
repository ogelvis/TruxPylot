import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTransferRecipient, resolveNigerianAccount } from '@/lib/paystack-transfers';

const input = z.object({
  bankCode: z.string().trim().min(2).max(20),
  accountNumber: z.string().trim().regex(/^\d{10}$/),
  bankName: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Select a bank and enter a valid 10-digit account number.' }, { status: 400 });
  }

  try {
    // Resolve the account directly with Paystack. The returned account name is
    // authoritative and is never taken from user input.
    const resolved = await resolveNigerianAccount(parsed.data.accountNumber, parsed.data.bankCode);
    if (!resolved?.account_name || !/^\d{10}$/.test(resolved.account_number)) {
      return NextResponse.json({ error: 'Paystack could not verify this bank account.' }, { status: 422 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    // Create/update the Paystack transfer recipient only after the bank account
    // has been successfully resolved.
    const recipient = await createTransferRecipient({
      name: resolved.account_name,
      accountNumber: resolved.account_number,
      bankCode: parsed.data.bankCode,
      email: user?.email,
      metadata: { truxpylotUserId: session.userId },
    });

    const account = await prisma.payoutAccount.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        bankName: parsed.data.bankName,
        bankCode: parsed.data.bankCode,
        accountNumber: resolved.account_number,
        accountName: resolved.account_name,
        verified: true,
        verifiedAt: new Date(),
        paystackRecipientCode: recipient.recipient_code,
      },
      update: {
        bankName: parsed.data.bankName,
        bankCode: parsed.data.bankCode,
        accountNumber: resolved.account_number,
        accountName: resolved.account_name,
        verified: true,
        verifiedAt: new Date(),
        paystackRecipientCode: recipient.recipient_code,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PAYOUT_ACCOUNT_VERIFIED',
        entity: 'PayoutAccount',
        entityId: account.id,
        data: {
          bankCode: parsed.data.bankCode,
          accountNumber: resolved.account_number,
          accountName: resolved.account_name,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      account: {
        bankName: account.bankName,
        bankCode: account.bankCode,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        verified: account.verified,
        verifiedAt: account.verifiedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify this bank account.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
