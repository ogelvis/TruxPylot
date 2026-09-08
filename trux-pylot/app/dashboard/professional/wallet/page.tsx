import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { WalletActions } from '@/components/wallet-actions';
export default async function WalletPage() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } } } });
  if (!professional) return null;
  const wallet = professional.wallet;
  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/wallet">
    <main className="dash-page"><h1>Your wallet.</h1><p className="subcopy">Secure ledger for funding, earnings and payouts.</p>
      <section className="metrics"><div className="metric"><span>Available</span><b>₦{((wallet?.availableBalance ?? 0) / 100).toLocaleString()}</b></div><div className="metric"><span>Pending</span><b>₦{((wallet?.pendingBalance ?? 0) / 100).toLocaleString()}</b></div></section>
      <section className="panel"><div className="panel-head"><h2>Fund wallet</h2></div><WalletActions /></section>
      <section className="panel"><div className="panel-head"><h2>Transaction history</h2></div>{wallet?.transactions.length ? wallet.transactions.map(t => <div className="table-row" key={t.id}><div className="job-name"><b>{t.description}</b><span>{t.source.replaceAll('_', ' ')}</span></div><small className={t.type === 'CREDIT' ? 'status paid' : 'status pending'}>{t.type === 'CREDIT' ? '+' : '-'}₦{(t.amount / 100).toLocaleString()}</small><small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(t.createdAt)}</small><span className="status">{t.status}</span></div>) : <div className="empty">No wallet transactions yet.</div>}</section>
    </main>
  </AppShell>;
}
