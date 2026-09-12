import { requireRole } from '@/lib/guard';
import { AppShell } from '@/components/app-shell';
import { AdminFinance } from '@/components/admin-finance';

export const dynamic = 'force-dynamic';

export default async function AdminMVaultPage() {
  await requireRole('ADMIN');
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/wallet"><main className="dash-page admin-finance-page"><div className="finance-hero"><div><p className="page-kicker">PYLOTVAULT CONTROL</p><h1>Financial control center.</h1><p className="subcopy">Every MVault movement, payout request, bank transfer and provider status in one operational view.</p></div><span className="wallet-live"><i/> Live ledger</span></div><AdminFinance/></main></AppShell>;
}
