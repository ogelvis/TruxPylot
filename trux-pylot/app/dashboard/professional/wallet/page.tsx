import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { WalletActions } from '@/components/wallet-actions';
import { DedicatedAccount } from '@/components/dedicated-account';
import { WalletFundingStatus } from '@/components/wallet-funding-status';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: { wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } } },
  });
  if (!professional) return null;

  const wallet = professional.wallet;
  const [earned, withdrawn, payoutAccountRaw] = await Promise.all([
    wallet
      ? prisma.walletTransaction.aggregate({
          where: { walletId: wallet.id, type: 'CREDIT', status: 'COMPLETED', source: { in: ['JOB_EARNING', 'REFERRAL_REWARD', 'ADJUSTMENT'] } },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    prisma.withdrawal.aggregate({
      where: { userId: session.userId, status: { not: 'REJECTED' } },
      _sum: { amount: true },
    }),
    prisma.payoutAccount.findUnique({
      where: { userId: session.userId },
      select: { bankName: true, accountName: true, accountNumber: true, bankCode: true, verified: true, verifiedAt: true },
    }),
  ]);

  const payoutAccount = payoutAccountRaw
    ? { ...payoutAccountRaw, verifiedAt: payoutAccountRaw.verifiedAt?.toISOString() ?? null }
    : null;
  const money = (amount: number | null | undefined) => `₦${((amount ?? 0) / 100).toLocaleString('en-NG')}`;

  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/wallet">
    <main className="dash-page wallet-dashboard">
      <WalletFundingStatus />

      <div className="wallet-heading">
        <div>
          <span className="wallet-kicker">PYLOTWALLET / FINANCE</span>
          <h1>Your financial center.</h1>
          <p className="subcopy">One place to fund your wallet, manage payouts and track every naira.</p>
        </div>
        <span className="wallet-live"><i /> Ledger online</span>
      </div>

      <section className="wallet-overview">
        <div className="wallet-balance"><span>AVAILABLE BALANCE</span><strong>{money(wallet?.availableBalance)}</strong><small>Ready for eligible spending and withdrawals</small><div className="wallet-gridline" /></div>
        <div className="wallet-mini"><span>PENDING</span><strong>{money(wallet?.pendingBalance)}</strong><small>Awaiting settlement</small></div>
        <div className="wallet-mini"><span>TOTAL EARNED</span><strong>{money(earned._sum.amount)}</strong><small>Completed earnings & rewards</small></div>
        <div className="wallet-mini"><span>TOTAL WITHDRAWN</span><strong>{money(withdrawn._sum.amount)}</strong><small>Wallet withdrawal activity</small></div>
      </section>

      <div className="wallet-primary-actions">
        <a className="wallet-cta primary" href="#wallet-money-in">＋ Add money</a>
        <a className="wallet-cta secondary" href="#wallet-money-out">↓ Withdraw funds</a>
        <a className="wallet-cta ghost" href="#wallet-history">View activity →</a>
      </div>

      <section className="wallet-command-grid">
        <div className="wallet-stack" id="wallet-money-in">
          <div className="wallet-section-label"><span>MONEY IN</span><small>Fund your PylotWallet</small></div>
          <section className="wallet-panel wallet-panel-modern">
            <div className="wallet-panel-head"><div><span className="wallet-step">01</span><div><h2>Fund wallet</h2><p>Instant card or bank-based funding options.</p></div></div><span className="wallet-secure">SECURE</span></div>
            <WalletActions availableBalance={wallet?.availableBalance ?? 0} payoutAccount={payoutAccount} section="fund" />
          </section>
          <section className="wallet-panel wallet-panel-modern">
            <div className="wallet-panel-head"><div><span className="wallet-step">02</span><div><h2>Bank transfer</h2><p>Your dedicated TruxPylot funding account.</p></div></div><span className="wallet-secure">DVA</span></div>
            <DedicatedAccount />
          </section>
        </div>

        <div className="wallet-stack" id="wallet-money-out">
          <div className="wallet-section-label"><span>MONEY OUT</span><small>Manage your payout destination</small></div>
          <section className="wallet-panel wallet-panel-modern">
            <div className="wallet-panel-head"><div><span className="wallet-step">03</span><div><h2>Payout account</h2><p>Verified bank details for withdrawals.</p></div></div><span className={`wallet-secure ${payoutAccount?.verified?'wallet-secure-success':''}`}>{payoutAccount?.verified?'VERIFIED':'ACTION NEEDED'}</span></div>
            <WalletActions availableBalance={wallet?.availableBalance ?? 0} payoutAccount={payoutAccount} section="payout" />
          </section>
          <section className="wallet-panel wallet-panel-modern">
            <div className="wallet-panel-head"><div><span className="wallet-step">04</span><div><h2>Withdraw funds</h2><p>Request a payout from your available balance.</p></div></div><span className="wallet-secure">MIN ₦1,000</span></div>
            <WalletActions availableBalance={wallet?.availableBalance ?? 0} payoutAccount={payoutAccount} section="withdraw" />
          </section>
        </div>
      </section>

      <section className="wallet-panel wallet-history wallet-history-modern" id="wallet-history">
        <div className="wallet-panel-head"><div><div><h2>Transaction activity</h2><p>Every wallet movement, directly from the ledger.</p></div></div><span className="wallet-count">{wallet?.transactions.length ?? 0}</span></div>
        <div className="wallet-history-header"><span>ACTIVITY</span><span>AMOUNT</span></div>
        {wallet?.transactions.length ? wallet.transactions.map(t => <div className="wallet-transaction" key={t.id}>
          <span className={`wallet-transaction-icon ${t.type === 'CREDIT' ? 'in' : 'out'}`}>{t.type === 'CREDIT' ? '↓' : '↑'}</span>
          <div><b>{t.description}</b><small>{t.source.replaceAll('_', ' ')} · {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(t.createdAt)}{t.reference ? ` · ${t.reference}` : ''}</small></div>
          <strong className={t.type === 'CREDIT' ? 'credit' : 'debit'}>{t.type === 'CREDIT' ? '+' : '-'}₦{(t.amount / 100).toLocaleString('en-NG')}<em>{t.status}</em></strong>
        </div>) : <div className="wallet-empty">No wallet activity yet.<span>Your confirmed funding and earnings will appear here.</span></div>}
      </section>
    </main>
  </AppShell>;
}
