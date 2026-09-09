import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim() || '';
  const status = url.searchParams.get('status')?.trim() || '';
  const [walletTransactions, fundings, withdrawals, transfers, payments] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { ...(status ? { status: status as any } : {}), ...(search ? { OR: [{ reference: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}) },
      include: { wallet: { include: { professional: { select: { fullName: true, user: { select: { email: true } } } } } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    }),
    prisma.walletFunding.findMany({ include: { wallet: { include: { professional: { select: { fullName: true, user: { select: { email: true } } } } } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.withdrawal.findMany({ where: { source: 'WALLET' }, include: { user: { select: { email: true, professional: { select: { fullName: true } } } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.incomingTransfer.findMany({ include: { dedicatedAccount: { include: { professional: { select: { fullName: true, user: { select: { email: true } } } } } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.payment.findMany({ include: { job: { include: { customer: { include: { user: { select: { email: true } } } }, professional: { select: { fullName: true, user: { select: { email: true } } } } } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);
  const transactions = [
    ...walletTransactions.map(t => ({ id: t.id, kind: 'WALLET_LEDGER', reference: t.reference, amount: t.amount, status: t.status, source: t.source, description: t.description, createdAt: t.createdAt, user: t.wallet.professional.user.email, name: t.wallet.professional.fullName, metadata: t.metadata })),
    ...fundings.map(f => ({ id: f.id, kind: 'WALLET_FUNDING', reference: f.reference, amount: f.amount, status: f.status, source: 'FUNDING', description: 'Wallet funding checkout', createdAt: f.createdAt, user: f.wallet.professional.user.email, name: f.wallet.professional.fullName, metadata: { providerEventId: f.providerEventId } })),
    ...withdrawals.map(w => ({ id: w.id, kind: 'WITHDRAWAL', reference: w.providerReference ?? w.id, amount: w.amount, status: w.status, source: 'WITHDRAWAL', description: w.rejectionReason ?? 'Wallet withdrawal', createdAt: w.createdAt, user: w.user.email, name: w.user.professional?.fullName ?? w.user.email, metadata: { providerTransferId: w.providerTransferId, providerStatus: w.providerStatus, accountNumber: w.accountNumber ? `••••${w.accountNumber.slice(-4)}` : null } })),
    ...transfers.map(t => ({ id: t.id, kind: 'DVA_TRANSFER', reference: t.reference, amount: t.amount, status: t.status, source: 'DVA_TRANSFER', description: 'Incoming bank transfer', createdAt: t.createdAt, user: t.dedicatedAccount?.professional.user.email ?? 'Unmatched', name: t.dedicatedAccount?.professional.fullName ?? 'Unmatched transfer', metadata: t.payload })),
    ...payments.map(p => ({ id: p.id, kind: 'JOB_PAYMENT', reference: p.reference, amount: p.amount, status: p.status, source: 'JOB_PAYMENT', description: `Job payment ${p.jobId}`, createdAt: p.createdAt, user: p.job.customer.user.email, name: p.job.professional?.fullName ?? p.job.customer.user.email, metadata: { providerEventId: p.providerEventId } })),
  ].filter(item => !search || `${item.reference ?? ''} ${item.user} ${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 300);
  return NextResponse.json({ transactions });
}
