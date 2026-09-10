import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function admin() { return requireAdminSession(); }

export async function GET(request: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search')?.trim() || '';
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      source: 'WALLET',
      ...(status && ['REQUESTED','REVIEWING','APPROVED','PAID','REJECTED','FAILED'].includes(status) ? { status: status as any } : {}),
      ...(search ? { OR: [
        { id: { contains: search, mode: 'insensitive' } },
        { providerReference: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { accountNumber: { contains: search } },
      ] } : {}),
    },
    include: { user: { select: { id: true, email: true, professional: { select: { fullName: true, wallet: { select: { availableBalance: true } } } } } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ withdrawals });
}
