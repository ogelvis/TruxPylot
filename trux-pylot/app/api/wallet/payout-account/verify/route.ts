import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTransferRecipient, resolveNigerianAccount } from '@/lib/paystack-transfers';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const account = await prisma.payoutAccount.findUnique({ where: { userId: session.userId } });
  if (!account || !account.bankCode) return NextResponse.json({ error: 'Save your bank details first.' }, { status: 400 });
  try {
    const resolved = await resolveNigerianAccount(account.accountNumber, account.bankCode);
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
    const recipient = await createTransferRecipient({
      name: resolved.account_name,
      accountNumber: resolved.account_number,
      bankCode: account.bankCode,
      email: user?.email,
      metadata: { truxpylotUserId: session.userId },
    });
    const updated = await prisma.payoutAccount.update({
      where: { id: account.id },
      data: {
        accountName: resolved.account_name,
        accountNumber: resolved.account_number,
        verified: true,
        verifiedAt: new Date(),
        paystackRecipientCode: recipient.recipient_code,
      },
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'PAYOUT_ACCOUNT_VERIFIED', entity: 'PayoutAccount', entityId: account.id, data: { bankCode: account.bankCode, accountNumber: resolved.account_number, accountName: resolved.account_name } } });
    return NextResponse.json({ ok: true, account: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify this bank account.';
    await prisma.payoutAccount.update({ where: { id: account.id }, data: { verified: false, verifiedAt: null, paystackRecipientCode: null } }).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
