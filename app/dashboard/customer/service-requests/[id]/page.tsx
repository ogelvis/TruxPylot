import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { ServiceRequestCancelButton } from '@/components/service-request-cancel-button';

const STEPS = [
  { key: 'SUBMITTED', label: 'Request submitted' },
  { key: 'CSD_REVIEWING', label: 'CSD reviewing' },
  { key: 'AVAILABILITY_CONFIRMATION', label: 'Confirming availability' },
  { key: 'PROFESSIONAL_CONFIRMED', label: 'Professional confirmed' },
  { key: 'CONNECTED', label: 'Connected' },
  { key: 'COMPLETED', label: 'Completed' },
];

const CANCELLABLE_FROM = new Set(['SUBMITTED', 'CSD_REVIEWING', 'AVAILABILITY_CONFIRMATION']);
const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

export default async function ServiceRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('CUSTOMER');
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return null;

  const req = await prisma.serviceRequest.findFirst({
    where: { id, customerId: customer.id },
    include: { professional: true, category: true },
  });
  if (!req) notFound();

  const isTerminalNegative = req.status === 'DECLINED' || req.status === 'CANCELLED';
  const currentIndex = STEPS.findIndex(s => s.key === req.status);

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} avatarUrl={customer.avatarUrl} active="/dashboard/customer/service-requests">
      <main className="dash-page">
        <Link href="/dashboard/customer/service-requests" className="back-link">← Back to my service requests</Link>
        <div className="overview-top">
          <div>
            <h1>{req.professional.fullName}</h1>
            <p className="page-ref">Reference REQ-{req.id.slice(-8).toUpperCase()}</p>
          </div>
          <span className={'status ' + req.status.toLowerCase()}>{req.status.replaceAll('_', ' ')}</span>
        </div>

        {!isTerminalNegative && (
          <section className="panel">
            <div className="panel-head"><h2>Progress</h2></div>
            <div className="job-detail-body">
              <div className="wizard-progress">
                {STEPS.map((s, i) => (
                  <div key={s.key} className={`wizard-step-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}>
                    <span>{i < currentIndex ? '✓' : i + 1}</span>{s.label}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
          </div>
        </section>

        {CANCELLABLE_FROM.has(req.status) && (
          <section className="panel">
            <div className="panel-head"><h2>Need to cancel?</h2></div>
            <div className="job-detail-body">
              <ServiceRequestCancelButton requestId={req.id} />
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
