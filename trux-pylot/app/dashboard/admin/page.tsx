import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireRole('ADMIN');
  const [customers, professionals, pending, jobs, payments, wallets, withdrawals, pendingWithdrawals, unmatched, successfulDva, recentTransactions] = await Promise.all([
    prisma.customer.count(),
    prisma.professional.count(),
    prisma.professional.count({ where: { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.job.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
    prisma.wallet.aggregate({ _sum: { availableBalance: true } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { source: 'WALLET' } }),
    prisma.withdrawal.count({ where: { source: 'WALLET', status: { in: ['REQUESTED', 'REVIEWING', 'APPROVED'] } } }),
    prisma.incomingTransfer.count({ where: { status: 'UNMATCHED' } }),
    prisma.incomingTransfer.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    prisma.walletTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { wallet: { include: { professional: { select: { fullName: true } } } } } }),
  ]);
  const money = (n: number | null | undefined) => `₦${((n ?? 0) / 100).toLocaleString('en-NG')}`;
  const withdrawalTotal = withdrawals._sum.amount ?? 0;
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin">
    <main className="dash-page admin-finance-dashboard">
      <div className="finance-hero"><div><p className="page-kicker">MASTER CONTROL / FINANCE</p><h1>Financial operations at a glance.</h1><p className="subcopy">Monitor wallet liabilities, deposits, payouts, payment activity and operational exceptions from one control center.</p></div><Link className="wallet-cta primary" href="/dashboard/admin/wallet">Open finance control center →</Link></div>
      <section className="metrics">
        <div className="metric"><span>Wallet liabilities</span><b>{money(wallets._sum.availableBalance)}</b><small>Current user wallet balances</small></div>
        <div className="metric"><span>Total deposits</span><b>{money((payments._sum.amount ?? 0) + (successfulDva._sum.amount ?? 0))}</b><small>Successful platform + DVA inflows</small></div>
        <div className="metric"><span>Total withdrawals</span><b>{money(withdrawalTotal)}</b><small>All wallet withdrawal requests</small></div>
        <div className="metric"><span>Pending withdrawals</span><b>{pendingWithdrawals}</b><small>Require operational review</small></div>
      </section>
      <section className="finance-stat-grid">
        <div className="panel finance-stat"><span>Successful job payments</span><strong>{money(payments._sum.amount)}</strong><small>Provider-confirmed</small></div>
        <div className="panel finance-stat"><span>Completed DVA inflows</span><strong>{money(successfulDva._sum.amount)}</strong><small>Bank-transfer wallet funding</small></div>
        <div className={`panel finance-stat ${unmatched ? 'attention' : ''}`}><span>Unmatched bank transfers</span><strong>{unmatched}</strong><small>{unmatched ? 'Needs reconciliation' : 'No exceptions'}</small></div>
        <div className="panel finance-stat"><span>Platform accounts</span><strong>{customers + professionals}</strong><small>{customers} customers · {professionals} professionals</small></div>
      </section>
      <section className="panel">
        <div className="panel-head"><div><h2>Financial operations</h2><p>Open the actual transaction, wallet and withdrawal records.</p></div><Link href="/dashboard/admin/wallet">View all finance →</Link></div>
        <div className="finance-quick-grid"><Link href="/dashboard/admin/wallet?tab=transactions">Transactions<span>Deposits, payouts, ledger and provider references</span></Link><Link href="/dashboard/admin/wallet?tab=withdrawals">Withdrawals<span>Review, approve, reject and process payouts</span></Link><Link href="/dashboard/admin/wallet?tab=incoming">Incoming bank transfers<span>{unmatched} unmatched transfer{unmatched === 1 ? '' : 's'}</span></Link><Link href="/dashboard/admin/wallet?tab=wallets">All wallets<span>Balances, DVA accounts and activity</span></Link></div>
      </section>
      <section className="panel"><div className="panel-head"><div><h2>Recent financial activity</h2><p>Latest ledger movements from the real database.</p></div></div>{recentTransactions.length ? recentTransactions.map(t => <div className="table-row" key={t.id}><b>{t.description}</b><span>{t.wallet.professional.fullName}</span><strong className={t.type === 'CREDIT' ? 'finance-credit' : 'finance-debit'}>{t.type === 'CREDIT' ? '+' : '-'}{money(t.amount)}</strong><small>{t.status} · {new Date(t.createdAt).toLocaleString('en-NG')}</small></div>) : <div className="empty">No wallet activity yet.</div>}</section>
      <section className="panel"><div className="panel-head"><div><h2>Trust operations</h2><p>{pending ? `${pending} professional verification request${pending === 1 ? '' : 's'} need review.` : 'No verification reviews are waiting right now.'}</p></div><Link href="/dashboard/admin/verifications">Review verifications →</Link></div></section>
    </main>
  </AppShell>;
}
