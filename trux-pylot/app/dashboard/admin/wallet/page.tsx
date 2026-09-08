import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function AdminWalletPage() {
  await requireRole('ADMIN');
  const [wallets, accounts, transfers, withdrawals] = await Promise.all([
    prisma.wallet.findMany({ include: { professional: { select: { fullName: true, user: { select: { email: true } } } } }, orderBy: { availableBalance: 'desc' }, take: 100 }),
    prisma.dedicatedAccount.findMany({ include: { professional: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.incomingTransfer.findMany({ include: { dedicatedAccount: { include: { professional: { select: { fullName: true } } } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.withdrawal.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  const money = (n: number) => `₦${(n / 100).toLocaleString()}`;
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/wallet"><main className="dash-page"><p className="page-kicker">FINANCE CONTROL CENTER</p><h1>Wallet operations</h1><p className="subcopy">Live ledger, dedicated accounts, transfers and payout requests. No synthetic balances.</p>
    <section className="metrics"><div className="metric"><span>Wallets</span><b>{wallets.length}</b></div><div className="metric"><span>Total available</span><b>{money(wallets.reduce((s, w) => s + w.availableBalance, 0))}</b></div><div className="metric"><span>DVA accounts</span><b>{accounts.length}</b></div><div className="metric"><span>Withdrawals</span><b>{withdrawals.length}</b></div></section>
    <section className="panel"><div className="panel-head"><h2>Wallets</h2></div>{wallets.map(w => <div className="table-row" key={w.id}><b>{w.professional.fullName}</b><span>{w.professional.user.email}</span><strong>{money(w.availableBalance)}</strong><small>pending {money(w.pendingBalance)}</small></div>)}</section>
    <section className="panel"><div className="panel-head"><h2>Withdrawals</h2></div>{withdrawals.map(w => <div className="table-row" key={w.id}><b>{money(w.amount)}</b><span>{w.user.email}</span><strong>{w.status}</strong><small>{w.accountNumber ? `••••${w.accountNumber.slice(-4)}` : 'No account'}</small></div>)}</section>
    <section className="panel"><div className="panel-head"><h2>Dedicated accounts & incoming transfers</h2></div>{accounts.map(a => <div className="table-row" key={a.id}><b>{a.professional.fullName}</b><span>{a.bankName ?? 'Pending'} {a.accountNumber ?? ''}</span><strong>{a.status}</strong></div>)}{transfers.map(t => <div className="table-row" key={t.id}><b>{money(t.amount)}</b><span>{t.reference}</span><strong>{t.status}</strong></div>)}</section>
  </main></AppShell>;
}
