import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { WalletActions } from '@/components/wallet-actions';
import { DedicatedAccount } from '@/components/dedicated-account';
export default async function WalletPage() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } } } });
  if (!professional) return null;
  const wallet = professional.wallet;
  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/wallet">
    <main className="dash-page wallet-dashboard">
      <div className="wallet-heading"><div><span className="wallet-kicker">PYLOTWALLET / FINANCE</span><h1>Money, in motion.</h1><p className="subcopy">A live control room for funding, earnings and payouts.</p></div><span className="wallet-live"><i /> Ledger online</span></div>
      <section className="wallet-overview">
        <div className="wallet-balance"><span>AVAILABLE BALANCE</span><strong>₦{((wallet?.availableBalance ?? 0) / 100).toLocaleString()}</strong><small>Ready for promotions and withdrawals</small><div className="wallet-gridline" /></div>
        <div className="wallet-mini"><span>PENDING</span><strong>₦{((wallet?.pendingBalance ?? 0) / 100).toLocaleString()}</strong><small>Awaiting settlement</small></div>
        <div className="wallet-mini"><span>LEDGER EVENTS</span><strong>{wallet?.transactions.length ?? 0}</strong><small>Latest 50 records</small></div>
      </section>
      <div className="wallet-columns">
        <div>
          <section className="wallet-panel wallet-fund-panel"><div className="wallet-panel-head"><div><span className="wallet-step">01</span><div><h2>Add funds</h2><p>Use secure Paystack checkout.</p></div></div><span className="wallet-arrow">↗</span></div><WalletActions /></section>
          <section className="wallet-panel"><div className="wallet-panel-head"><div><span className="wallet-step">02</span><div><h2>Bank transfer rail</h2><p>Your personal Paystack account.</p></div></div><span className="wallet-secure">SECURE</span></div><DedicatedAccount /></section>
        </div>
        <section className="wallet-panel wallet-history"><div className="wallet-panel-head"><div><h2>Activity stream</h2><p>Every balance movement, recorded.</p></div><span className="wallet-count">{wallet?.transactions.length ?? 0}</span></div>{wallet?.transactions.length ? wallet.transactions.map(t => <div className="wallet-transaction" key={t.id}><span className={`wallet-transaction-icon ${t.type === 'CREDIT' ? 'in' : 'out'}`}>{t.type === 'CREDIT' ? '↓' : '↑'}</span><div><b>{t.description}</b><small>{t.source.replaceAll('_', ' ')} · {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(t.createdAt)}</small></div><strong className={t.type === 'CREDIT' ? 'credit' : 'debit'}>{t.type === 'CREDIT' ? '+' : '-'}₦{(t.amount / 100).toLocaleString()}<em>{t.status}</em></strong></div>) : <div className="wallet-empty">No wallet activity yet.<span>Your confirmed funding and earnings will appear here.</span></div>}</section>
      </div>
    </main>
  </AppShell>;
}
