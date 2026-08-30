import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { VerificationActions } from '@/components/verification-actions';

export default async function VerificationsQueue() {
  await requireRole('ADMIN');

  const requests = await prisma.verificationRequest.findMany({
    where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    include: { professional: { include: { user: true, services: { include: { category: true } } } }, documents: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/verifications">
      <main className="dash-page">
        <p className="page-kicker">TRUST OPERATIONS</p>
        <h1>Verification queue.</h1>
        <p className="subcopy">{requests.length} professional{requests.length === 1 ? '' : 's'} waiting for review.</p>

        {requests.length ? requests.map(r => (
          <section className="panel verification-card" key={r.id}>
            <div className="panel-head">
              <h2>{r.professional.fullName}</h2>
              <span className={`status ${r.status.toLowerCase()}`}>{r.status.replaceAll('_', ' ')}</span>
            </div>
            <div className="job-detail-body">
              <p><b>Email</b> — {r.professional.user.email}</p>
              <p><b>Phone</b> — {r.professional.user.phone ?? 'Not provided'}</p>
              <p><b>Profession</b> — {r.professional.profession ?? 'Not specified'}</p>
              <p><b>Location</b> — {r.professional.location ?? 'Not specified'}</p>
              <p><b>Experience</b> — {r.professional.yearsExperience ?? '—'} years</p>
              {r.professional.bio && <p><b>Bio</b> — {r.professional.bio}</p>}
              {r.professional.services.length > 0 && (
                <p><b>Services</b> — {r.professional.services.map(s => s.category.name).join(', ')}</p>
              )}
              <p><b>Documents submitted</b> — {r.documents.length}</p>
              <p><b>Submitted</b> — {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(r.createdAt)}</p>

              <VerificationActions requestId={r.id} />
            </div>
          </section>
        )) : (
          <div className="empty">No verification requests are waiting right now.</div>
        )}
      </main>
    </AppShell>
  );
}
