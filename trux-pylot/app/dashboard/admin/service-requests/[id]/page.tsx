import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { CsdActions } from '@/components/csd-actions';

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
const TERMINAL = new Set(['COMPLETED', 'DECLINED', 'CANCELLED']);

export default async function CSDRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;

  const req = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      professional: { include: { user: true } },
      category: true,
    },
  });
  if (!req) notFound();

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/service-requests">
      <main className="dash-page">
        <Link href="/dashboard/admin/service-requests" className="back-link">← Back to CSD queue</Link>

        <div className="overview-top">
          <div>
            <h1>{req.category.name} request</h1>
            <p className="page-ref">Reference REQ-{req.id.slice(-8).toUpperCase()}</p>
          </div>
          <span className={'status ' + req.status.toLowerCase()}>{STATUS_LABEL[req.status] ?? req.status}</span>
        </div>

        <div className="detail-grid">
          <section className="panel">
            <div className="panel-head"><h2>Customer</h2></div>
            <div className="job-detail-body">
              <p><b>Name</b> — {req.customer.fullName}</p>
              <p><b>Email</b> — {req.customer.user.email}</p>
              <p><b>Phone</b> — {req.customer.user.phone ?? 'Not provided'}</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Professional</h2></div>
            <div className="job-detail-body">
              <p><b>Name</b> — {req.professional.fullName}</p>
              <p><b>Email</b> — {req.professional.user.email}</p>
              <p><b>Phone</b> — {req.professional.user.phone ?? 'Not provided'}</p>
              <p><b>Profession</b> — {req.professional.profession ?? 'Not specified'}</p>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Request details</h2></div>
          <div className="job-detail-body">
            <p><b>Service</b> — {req.category.name}</p>
            <p><b>Location</b> — {req.location}</p>
            {req.preferredDate && <p><b>Preferred date</b> — {dateFmt.format(req.preferredDate)}</p>}
            {req.preferredTime && <p><b>Preferred time</b> — {req.preferredTime}</p>}
            <p><b>Description</b> — {req.description}</p>
            {req.additionalRequirements && <p><b>Additional requirements</b> — {req.additionalRequirements}</p>}
            <p><b>Submitted</b> — {dateFmt.format(req.createdAt)}</p>
            <p><b>Last updated</b> — {dateFmt.format(req.updatedAt)}</p>
            {req.csdNotes && <p><b>CSD notes</b> — {req.csdNotes}</p>}
          </div>
        </section>

        {TERMINAL.has(req.status) ? (
          <section className="panel">
            <div className="panel-head"><h2>Outcome</h2></div>
            <div className="job-detail-body">
              <p>This request is <b>{(STATUS_LABEL[req.status] ?? req.status).toLowerCase()}</b>. No further action is available.</p>
            </div>
          </section>
        ) : (
          <section className="panel verification-card">
            <div className="panel-head"><h2>Update this request</h2></div>
            <CsdActions requestId={req.id} status={req.status} />
          </section>
        )}
      </main>
    </AppShell>
  );
}
