import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { VerificationActions } from '@/components/verification-actions';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MORE_INFO_REQUIRED: 'More info required',
};

const dateTimeFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

export default async function VerificationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;

  const request = await prisma.verificationRequest.findUnique({
    where: { id },
    include: { professional: { include: { user: true } }, documents: true },
  });
  if (!request) notFound();

  const history = await prisma.auditLog.findMany({
    where: { entity: 'VerificationRequest', entityId: id },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const status = request.status;

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/verifications">
      <main className="dash-page">
        <Link href="/dashboard/admin/verifications" className="back-link">← Back to verification center</Link>

        <div className="overview-top">
          <div>
            <h1>{request.professional.fullName}</h1>
            <p className="page-ref">Request #{request.id.slice(-6).toUpperCase()}</p>
          </div>
          <span className={'status ' + request.status.toLowerCase()}>{STATUS_LABEL[request.status] ?? request.status}</span>
        </div>

        <div className="detail-grid">
          <section className="panel">
            <div className="panel-head"><h2>Professional</h2></div>
            <div className="job-detail-body">
              <p><b>Email</b> — {request.professional.user.email}</p>
              <p><b>Phone</b> — {request.professional.user.phone ?? 'Not provided'}</p>
              <p><b>Profession</b> — {request.professional.profession ?? 'Not specified'}</p>
              <p><b>Location</b> — {request.professional.location ?? 'Not specified'}</p>
              <p><b>Years of experience</b> — {request.professional.yearsExperience ?? 'Not specified'}</p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Request</h2></div>
            <div className="job-detail-body">
              <p><b>Submitted</b> — {dateTimeFmt.format(request.createdAt)}</p>
              <p><b>Reviewed</b> — {request.reviewedAt ? dateTimeFmt.format(request.reviewedAt) : 'Not yet reviewed'}</p>
              {request.notes && <p><b>Latest reviewer notes</b> — {request.notes}</p>}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Documents</h2></div>
          <div className="job-detail-body">
            {request.documents.length ? (
              <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {request.documents.map((d, i) => (
                  <a key={d.id} href={'/api/admin/documents/' + d.id} target="_blank" rel="noreferrer" className="tag">
                    Document {i + 1} ({d.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}) ↗
                  </a>
                ))}
              </p>
            ) : (
              <p>No documents attached.</p>
            )}
          </div>
        </section>

        {history.length > 0 && (
          <section className="panel">
            <div className="panel-head"><h2>Review history</h2></div>
            {history.map(h => (
              <div className="table-row audit-row" key={h.id} style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
                <div className="job-name">
                  <b>{h.action.replaceAll('_', ' ')}</b>
                  {(h.data as { notes?: string } | null)?.notes && <span>{(h.data as { notes?: string }).notes}</span>}
                </div>
                <small>{h.user?.email ?? 'System'}</small>
                <small>{dateTimeFmt.format(h.createdAt)}</small>
              </div>
            ))}
          </section>
        )}

        {status === 'SUBMITTED' || status === 'UNDER_REVIEW' ? (
          <section className="panel verification-card">
            <div className="panel-head"><h2>Review this request</h2></div>
            <VerificationActions requestId={request.id} status={status} />
          </section>
        ) : (
          <section className="panel">
            <div className="panel-head"><h2>Outcome</h2></div>
            <div className="job-detail-body">
              <p>This request has already been reviewed and is <b>{(STATUS_LABEL[request.status] ?? request.status).toLowerCase()}</b>. No further action is available here.</p>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
