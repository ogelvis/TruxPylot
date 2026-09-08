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
  const [earned, withdrawn, payoutAccount] = await Promise.all([
    wallet
      ? prisma.walletTransaction.aggregate({
          where: { walletId: wallet.id, type: 'CREDIT', status: 'COMPLETED' },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    prisma.withdrawal.aggregate({
      where: { userId: session.userId, status: { not: 'REJECTED' } },
      _sum: { amount: true },
    }),
    prisma.payoutAccount.findUnique({ where: { userId: session.userId }, select: { bankName: true, accountName: true, accountNumber: true, verified: true } }),
  ]);
  const money = (amount: number | null | undefined) => `₦${((amount ?? 0) / 100).toLocaleString('en-NG')}`;
  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/wallet">
    <main className="dash-page wallet-dashboard">
      <div className="wallet-heading"><div><span className="wallet-kicker">PYLOTWALLET / FINANCE</span><h1>Your financial center.</h1><p className="subcopy">A live control room for funding, earnings and payouts.</p></div><span className="wallet-live"><i /> Ledger online</span></div>
      <section className="wallet-overview">
        <div className="wallet-balance"><span>AVAILABLE BALANCE</span><strong>{money(wallet?.availableBalance)}</strong><small>Ready for promotions and withdrawals</small><div className="wallet-gridline" /></div>
        <div className="wallet-mini"><span>PENDING</span><strong>{money(wallet?.pendingBalance)}</strong><small>Awaiting settlement</small></div>
        <div className="wallet-mini"><span>TOTAL EARNED</span><strong>{money(earned._sum.amount)}</strong><small>Completed ledger credits</small></div>
        <div className="wallet-mini"><span>TOTAL WITHDRAWN</span><strong>{money(withdrawn._sum.amount)}</strong><small>Requested, excluding rejected</small></div>
      </section>
      <div className="wallet-primary-actions">
        <a className="wallet-cta primary" href="#wallet-fund">＋ Fund wallet</a>
        <a className="wallet-cta secondary" href="#wallet-withdraw">↓ Withdraw funds</a>
      </div>
      <div className="wallet-columns">
        <div>
          <section className="wallet-panel wallet-fund-panel" id="wallet-fund"><div className="wallet-panel-head"><div><span className="wallet-step">01</span><div><h2>Fund wallet</h2><p>Choose the route that works for you.</p></div></div><span className="wallet-arrow">↗</span></div><WalletActions availableBalance={wallet?.availableBalance ?? 0} payoutAccount={payoutAccount} /></section>
          <section className="wallet-panel" id="wallet-bank-transfer"><div className="wallet-panel-head"><div><span className="wallet-step">02</span><div><h2>Fund via bank transfer</h2><p>Your personal TruxPylot funding account.</p></div></div><span className="wallet-secure">MONEY IN</span></div><DedicatedAccount /></section>
          <section className="wallet-panel wallet-settings-panel"><div className="wallet-panel-head"><div><span className="wallet-step">03</span><div><h2>Wallet settings</h2><p>Manage payout and funding preferences securely.</p></div></div></div><div className="wallet-settings-grid"><a href="#wallet-withdraw">Payout account <span>Money out →</span></a><a href="#wallet-bank-transfer">Dedicated funding account <span>Money in →</span></a></div></section>
        </div>
        <section className="wallet-panel wallet-history" id="wallet-withdraw"><div className="wallet-panel-head"><div><h2>Withdraw funds</h2><p>Money out through your configured payout account.</p></div><span className="wallet-secure">MIN ₦2,000</span></div><WalletActions availableBalance={wallet?.availableBalance ?? 0} payoutAccount={payoutAccount} withdrawOnly /></section>
        <section className="wallet-panel wallet-history"><div className="wallet-panel-head"><div><h2>Transaction history</h2><p>Every balance movement, recorded from the ledger.</p></div><span className="wallet-count">{wallet?.transactions.length ?? 0}</span></div>{wallet?.transactions.length ? wallet.transactions.map(t => <div className="wallet-transaction" key={t.id}><span className={`wallet-transaction-icon ${t.type === 'CREDIT' ? 'in' : 'out'}`}>{t.type === 'CREDIT' ? '↓' : '↑'}</span><div><b>{t.description}</b><small>{t.source.replaceAll('_', ' ')} · {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(t.createdAt)}{t.reference ? ` · ${t.reference}` : ''}</small></div><strong className={t.type === 'CREDIT' ? 'credit' : 'debit'}>{t.type === 'CREDIT' ? '+' : '-'}₦{(t.amount / 100).toLocaleString('en-NG')}<em>{t.status}</em></strong></div>) : <div className="wallet-empty">No wallet activity yet.<span>Your confirmed funding and earnings will appear here.</span></div>}</section>
      </div>
    </main>
  </AppShell>;
}
