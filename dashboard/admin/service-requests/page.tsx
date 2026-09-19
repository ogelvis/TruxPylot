import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import type { ServiceRequestStatus } from '@prisma/client';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  CSD_REVIEWING: 'CSD reviewing',
  AVAILABILITY_CONFIRMATION: 'Confirming availability',
  PROFESSIONAL_CONFIRMED: 'Professional confirmed',
  CONNECTED: 'Connected',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

export default async function CSDQueue({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireRole('ADMIN');
  const { q, status } = await searchParams;

  const [requests, counts] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: {
        status: status && status !== 'ALL' ? (status as ServiceRequestStatus) : undefined,
        ...(q ? {
          OR: [
            { professional: { fullName: { contains: q, mode: 'insensitive' } } },
            { professional: { user: { email: { contains: q, mode: 'insensitive' } } } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { customer: true, professional: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.serviceRequest.groupBy({ by: ['status'], _count: true }),
  ]);

  const countFor = (s: string) => counts.find(c => c.status === s)?._count ?? 0;
  const openCount = counts.filter(c => !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(c.status)).reduce((a, c) => a + c._count, 0);

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/service-requests">
      <main className="dash-page">
        <h1>Customer Service &amp; Disburser (CSD) queue</h1>
        <p className="subcopy">Requests submitted from professional profiles. Review, confirm availability with the professional, then connect both parties.</p>

        <div className="metrics">
          <div className="metric"><span>Open requests</span><b>{openCount}</b></div>
          <div className="metric"><span>Awaiting review</span><b>{countFor('SUBMITTED')}</b></div>
          <div className="metric"><span>Connected</span><b>{countFor('CONNECTED')}</b></div>
          <div className="metric"><span>Completed</span><b>{countFor('COMPLETED')}</b></div>
        </div>

        <form className="user-filters" method="get">
          <input type="text" name="q" defaultValue={q ?? ''} placeholder="Search professional, email, or location" />
          <select name="status" defaultValue={status ?? 'ALL'}>
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <button type="submit">Filter</button>
        </form>

        <div className="panel">
          {requests.length ? requests.map(r => (
            <Link href={`/dashboard/admin/service-requests/${r.id}`} className="table-row job-row" key={r.id}>
              <div className="job-name">
                <b>{r.professional.fullName}</b>
                <span>Customer: {r.customer.fullName} · {r.category.name} · {r.location}</span>
              </div>
              <small>{dateFmt.format(r.createdAt)}</small>
              <span className={'status ' + r.status.toLowerCase()}>{STATUS_LABEL[r.status] ?? r.status}</span>
            </Link>
          )) : (
            <div className="empty">No service requests match these filters.</div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
