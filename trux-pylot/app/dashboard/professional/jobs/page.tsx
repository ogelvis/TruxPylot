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

export default async function ProfessionalJobs({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole('PROFESSIONAL');
  const { tab } = await searchParams;
  const activeTab = TABS.find(t => t.key === tab) ?? TABS[0];

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) {
    return <AppShell role="PROFESSIONAL" name="Professional" active="/dashboard/professional/jobs">
      <div className="empty">Complete your professional profile to start receiving jobs.</div></main>
    </AppShell>;
  }

  const jobs = await prisma.job.findMany({
    where: { professionalId: professional.id, status: activeTab.statuses ? { in: activeTab.statuses } : undefined },
    include: { customer: true, category: true, payment: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/jobs">
      <main className="dash-page">
        <h1>Job management</h1>
        <p className="subcopy">Track every job you have been requested for, from first contact to settlement.</p>

        <nav className="tab-bar">
          {TABS.map(t => (
            <Link key={t.key} href={`/dashboard/professional/jobs${t.key === 'all' ? '' : `?tab=${t.key}`}`} className={activeTab.key === t.key ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="panel">
          {jobs.length ? jobs.map(j => (
            <Link href={`/dashboard/professional/jobs/${j.id}`} className="table-row job-row" key={j.id}>
              <div className="job-name">
                <b>{j.category.name}</b>
                <span>{j.customer.fullName} · {j.location}</span>
              </div>
              <small>{j.budget ? `₦${j.budget.toLocaleString()}` : '—'}</small>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(j.createdAt)}</small>
              <span className={`status ${j.status.toLowerCase()}`}>{j.status.replaceAll('_', ' ')}</span>
            </Link>
          )) : (
            <div className="empty">No jobs in this category yet.</div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
