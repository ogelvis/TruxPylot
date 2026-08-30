import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { JobStatus } from '@prisma/client';

const TABS: { label: string; key: string; statuses?: JobStatus[] }[] = [
  { label: 'All', key: 'all' },
  { label: 'Active', key: 'active', statuses: ['ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'IN_PROGRESS'] },
  { label: 'Pending', key: 'pending', statuses: ['REQUESTED', 'QUOTED'] },
  { label: 'Completed', key: 'completed', statuses: ['COMPLETED', 'CUSTOMER_CONFIRMED', 'SETTLED'] },
  { label: 'Cancelled', key: 'cancelled', statuses: ['CANCELLED', 'REJECTED', 'DISPUTED', 'REFUNDED'] },
];

export default async function CustomerJobs({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole('CUSTOMER');
  const { tab } = await searchParams;
  const activeTab = TABS.find(t => t.key === tab) ?? TABS[0];

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return null;

  const jobs = await prisma.job.findMany({
    where: { customerId: customer.id, status: activeTab.statuses ? { in: activeTab.statuses } : undefined },
    include: { professional: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} active="/dashboard/customer/jobs">
      <main className="dash-page">
        <div className="overview-top">
          <div>
            <p className="page-kicker">MY REQUESTS</p>
            <h1>Your service requests.</h1>
          </div>
          <a className="primary" href="/marketplace">New request →</a>
        </div>

        <nav className="tab-bar">
          {TABS.map(t => (
            <Link key={t.key} href={`/dashboard/customer/jobs${t.key === 'all' ? '' : `?tab=${t.key}`}`} className={activeTab.key === t.key ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="panel">
          {jobs.length ? jobs.map(j => (
            <Link href={`/dashboard/customer/jobs/${j.id}`} className="table-row job-row" key={j.id}>
              <div className="job-name">
                <b>{j.category.name}</b>
                <span>{j.professional?.fullName ?? 'Finding a professional'} · {j.location}</span>
              </div>
              <small>{j.budget ? `₦${j.budget.toLocaleString()}` : '—'}</small>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(j.createdAt)}</small>
              <span className={`status ${j.status.toLowerCase()}`}>{j.status.replaceAll('_', ' ')}</span>
            </Link>
          )) : (
            <div className="empty">No requests in this category yet.</div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
