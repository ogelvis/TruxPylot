import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { VerificationSubmitForm } from '@/components/verification-submit-form';

const RESUBMITTABLE = new Set(['DRAFT', 'REJECTED', 'MORE_INFO_REQUIRED']);

const STATUS_COPY: Record<string, string> = {
  DRAFT: "You haven't submitted for verification yet.",
  SUBMITTED: 'Your documents are in the queue for review.',
  UNDER_REVIEW: 'An admin is currently reviewing your submission.',
  APPROVED: "You're verified — customers can see your badge and request your services.",
  REJECTED: 'Your last submission was not approved. You can submit again below.',
  MORE_INFO_REQUIRED: 'We need more information before approving you. Please resubmit below.',
};

export default async function VerificationPage() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({
    where: { userId: session.userId },
    include: {
      verificationRequests: { orderBy: { createdAt: 'desc' }, take: 1, include: { documents: true } },
    },
  });
  if (!professional) return null;
  const latest = professional.verificationRequests[0];

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus === 'APPROVED'} active="/dashboard/professional/verification">
      <main className="dash-page">
        <h1>Get verified.</h1>
        <p className="subcopy">Verification builds trust and is required before you appear in the marketplace.</p>

        <section className="panel">
          <div className="panel-head">
            <h2>Status</h2>
            <span className={'status ' + professional.verificationStatus.toLowerCase()}>{professional.verificationStatus.replaceAll('_', ' ')}</span>
          </div>
          <div className="job-detail-body">
            <p>{STATUS_COPY[professional.verificationStatus]}</p>
            {latest?.notes && (
              <p style={{ marginTop: 10 }}><b>Reviewer notes:</b> {latest.notes}</p>
            )}
          </div>
        </section>

        {RESUBMITTABLE.has(professional.verificationStatus) && (
          <section className="panel">
            <div className="panel-head"><h2>Submit documents</h2></div>
            <VerificationSubmitForm />
          </section>
        )}
      </main>
    </AppShell>
  );
}
