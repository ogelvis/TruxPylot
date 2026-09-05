import Link from 'next/link';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Request submitted',
  CSD_REVIEWING: 'CSD reviewing',
  AVAILABILITY_CONFIRMATION: 'Confirming availability',
  PROFESSIONAL_CONFIRMED: 'Professional confirmed',
  CONNECTED: 'Connected',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export default async function ServiceRequestsList() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return null;

  const requests = await prisma.serviceRequest.findMany({
    where: { customerId: customer.id },
    include: { professional: true, category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} avatarUrl={customer.avatarUrl} active="/dashboard/customer/service-requests">
      <main className="dash-page">
        <h1>Service requests</h1>
        <p className="subcopy">Requests you&apos;ve sent through a professional&apos;s profile — Truxpylot Customer Service reviews these before connecting you.</p>

        <div className="panel">
          {requests.length ? requests.map(r => (
            <Link href={`/dashboard/customer/service-requests/${r.id}`} className="table-row job-row" key={r.id}>
              <div className="job-name">
                <b>{r.professional.fullName}</b>
                <span>{r.category.name} · {r.location}</span>
              </div>
              <small>{dateFmt.format(r.createdAt)}</small>
              <span className={'status ' + r.status.toLowerCase()}>{STATUS_LABEL[r.status] ?? r.status}</span>
            </Link>
          )) : (
            <div className="empty">You haven&apos;t requested a service yet. <Link href="/marketplace">Browse professionals →</Link></div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
