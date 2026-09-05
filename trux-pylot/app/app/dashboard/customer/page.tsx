import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function CustomerDashboard() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({
    where: { userId: session.userId },
    include: {
      jobs: { include: { category: true, professional: true, payment: true }, take: 8, orderBy: { createdAt: 'desc' } },
    },
  });
  const jobs = customer?.jobs ?? [];

  const activeCount = jobs.filter(j => ['ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'IN_PROGRESS'].includes(j.status)).length;
  const pendingCount = jobs.filter(j => ['REQUESTED', 'QUOTED'].includes(j.status)).length;
  const completedCount = jobs.filter(j => j.status === 'SETTLED').length;
  const totalSpent = jobs.reduce((sum, j) => sum + (j.payment?.status === 'SUCCESS' ? j.payment.amount : 0), 0);

  return (
    <AppShell role="CUSTOMER" name={customer?.fullName ?? 'Customer'} avatarUrl={customer?.avatarUrl} active="/dashboard/customer">
      <main className="dash-page">
        <div className="overview-top">
          <div>
            <h1>Good morning, {customer?.fullName?.split(' ')[0]}.</h1>
            <p className="subcopy">Here is what is happening with your service requests.</p>
          </div>
          <a className="primary" href="/marketplace">Request a professional →</a>
        </div>

        <section className="metrics">
          <div className="metric"><span>Active requests</span><b>{activeCount}</b><small>In progress</small></div>
          <div className="metric"><span>Pending requests</span><b>{pendingCount}</b><small>Awaiting a quote</small></div>
          <div className="metric"><span>Completed jobs</span><b>{completedCount}</b><small>All time</small></div>
          <div className="metric"><span>Total spent</span><b>₦{(totalSpent / 100).toLocaleString()}</b><small>Across all jobs</small></div>
        </section>

        <section className="panel" id="jobs">
          <div className="panel-head"><h2>Recent service requests</h2><Link href="/dashboard/customer/jobs">View all →</Link></div>
          {jobs.length ? jobs.map(j => (
            <Link href={`/dashboard/customer/jobs/${j.id}`} className="table-row job-row" key={j.id}>
              <div className="job-name"><b>{j.category.name}</b><span>{j.description.slice(0, 55)}…</span></div>
              <small>{j.professional?.fullName ?? 'Finding a professional'}</small>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(j.createdAt)}</small>
              <span className={`status ${j.status.toLowerCase()}`}>{j.status.replaceAll('_', ' ')}</span>
            </Link>
          )) : <div className="empty">No jobs yet. Start by telling us what you need help with.</div>}
        </section>
      </main>
    </AppShell>
  );
}
