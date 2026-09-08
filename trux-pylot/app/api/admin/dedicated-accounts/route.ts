import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
export async function GET(request: Request) {
  await requireRole('ADMIN');
  const status = new URL(request.url).searchParams.get('status');
  const [accounts, transfers] = await Promise.all([
    prisma.dedicatedAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        professional: { select: { id: true, fullName: true, user: { select: { email: true } } } },
        walletId: true,
        paystackCustomerCode: true,
        accountNumber: true,
        accountName: true,
        bankName: true,
        bankSlug: true,
        active: true,
        createdAt: true,
        lastSyncedAt: true,
      },
    }),
    prisma.incomingTransfer.findMany({
      where: status && ['UNMATCHED', 'MATCHED', 'COMPLETED', 'PENDING', 'FAILED', 'REVERSED'].includes(status) ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { dedicatedAccount: { select: { accountNumber: true, bankName: true, professional: { select: { fullName: true, user: { select: { email: true } } } } } } },
    }),
  ]);
  return NextResponse.json({ accounts, transfers });
}
