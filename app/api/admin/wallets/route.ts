import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const wallets = await prisma.wallet.findMany({ orderBy: { availableBalance: 'desc' }, take: 500, include: { professional: { select: { id: true, fullName: true, user: { select: { email: true } } } }, dedicatedAccount: { select: { accountNumber: true, bankName: true, status: true, active: true } } } });
  return NextResponse.json({ wallets });
}
