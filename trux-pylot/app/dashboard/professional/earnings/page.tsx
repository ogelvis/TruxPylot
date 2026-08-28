import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { EarningsChart } from '@/components/earnings-chart';

export default async function Earnings() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: { wallet: true },
  });
  if (!professional) return null;

  const jobs = await prisma.job.findMany({
    where: { professionalId: professional.id, payment: { status: 'SUCCESS' } },
    include: { payment: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const totalEarnings = jobs.reduce((sum, j) => sum + (j.payment ? j.payment.amount - j.payment.commission : 0), 0);

  // Group last 6 months of successful payments for the chart.
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString('en-NG', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });
  const chartData = months.map(m => {
    const total = jobs
      .filter(j => j.payment && j.payment.createdAt.getFullYear() === m.year && j.payment.createdAt.getMonth() === m.month)
      .reduce((sum, j) => sum + (j.payment ? j.payment.amount - j.payment.commission : 0), 0);
    return { label: m.label, value: Math.round(total / 100) };
  });

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} active="/dashboard/professional/earnings">
      <main className="dash-page">
        <p className="page-kicker">EARNINGS</p>
        <h1>Your financial overview.</h1>
        <p className="subcopy">Track balances and payments from completed jobs.</p>

        <section className="metrics">
          <div className="metric"><span>Total earnings</span><b>₦{(totalEarnings / 100).toLocaleString()}</b><small>All time</small></div>
          <div className="metric"><span>Available balance</span><b>₦{((professional.wallet?.availableBalance ?? 0) / 100).toLocaleString()}</b><small>Ready to withdraw</small></div>
          <div className="metric"><span>Pending balance</span><b>₦{((professional.wallet?.pendingBalance ?? 0) / 100).toLocaleString()}</b><small>Awaiting settlement</small></div>
          <div className="metric"><span>Completed payments</span><b>{jobs.length}</b><small>Successful jobs</small></div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Earnings — last 6 months</h2></div>
          <div className="job-detail-body">
            <EarningsChart data={chartData} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Transaction history</h2></div>
          {jobs.length ? jobs.map(j => (
            <div className="table-row" key={j.id}>
              <div className="job-name"><b>{j.category.name}</b><span>Job #{j.id.slice(-6).toUpperCase()}</span></div>
              <small>₦{j.payment ? ((j.payment.amount - j.payment.commission) / 100).toLocaleString() : '—'}</small>
              <small>{j.payment ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(j.payment.createdAt) : '—'}</small>
              <span className="status paid">Paid</span>
            </div>
          )) : <div className="empty">No completed payments yet.</div>}
        </section>
      </main>
    </AppShell>
  );
}
