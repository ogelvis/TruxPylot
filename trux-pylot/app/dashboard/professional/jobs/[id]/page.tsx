import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { ProposalForm } from '@/components/proposal-form';

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('PROFESSIONAL');
  const { id } = await params;

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) notFound();

  const job = await prisma.job.findFirst({
    where: { id, professionalId: professional.id },
    include: { customer: true, category: true, payment: true, quotes: true, review: true },
  });
  if (!job) notFound();

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/jobs">
      <main className="dash-page">
        <Link href="/dashboard/professional/jobs" className="back-link">← Back to my jobs</Link>
        <div className="overview-top">
          <div>
            <h1>{job.category.name}</h1>
            <p className="page-ref">Job #{job.id.slice(-6).toUpperCase()}</p>
          </div>
          <span className={`status ${job.status.toLowerCase()}`}>{job.status.replaceAll('_', ' ')}</span>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Job description</h2></div>
          <div className="job-detail-body">
            <p>{job.description}</p>
          </div>
        </section>

        {job.quotes.length === 0 && !['COMPLETED', 'SETTLED', 'CANCELLED', 'REJECTED'].includes(job.status) && (
          <section className="panel">
            <div className="panel-head"><h2>Send your proposal</h2></div>
            <div className="job-detail-body">
              <p>Give the customer a clear price, timeline and description of the work you will deliver.</p>
              <ProposalForm jobId={job.id} budget={job.budget} />
            </div>
          </section>
        )}

        {job.quotes.length > 0 && (
          <section className="panel">
            <div className="panel-head"><h2>Your proposal</h2></div>
            <div className="job-detail-body">
              {job.quotes.map(quote => (
                <div key={quote.id}>
                  <p><b>₦{quote.amount.toLocaleString()}</b> · {quote.priceType.toLowerCase()} · {quote.status.toLowerCase()}</p>
                  {quote.estimatedDuration && <p>Duration: {quote.estimatedDuration}</p>}
                  {quote.message && <p>{quote.message}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="detail-grid">
          <div className="panel">
            <div className="panel-head"><h2>Client</h2></div>
            <div className="job-detail-body">
              <p><b>{job.customer.fullName}</b></p>
              <p>{job.location}</p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Schedule &amp; budget</h2></div>
            <div className="job-detail-body">
              <p>Preferred date: {job.preferredAt ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(job.preferredAt) : 'Flexible'}</p>
              <p>Budget: {job.budget ? `₦${job.budget.toLocaleString()}` : 'Not specified'}</p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Payment</h2></div>
            <div className="job-detail-body">
              {job.payment ? (
                <>
                  <p>Amount: ₦{(job.payment.amount / 100).toLocaleString()}</p>
                  <p>Status: <span className={`status ${job.payment.status.toLowerCase()}`}>{job.payment.status}</span></p>
                </>
              ) : <p>No payment recorded for this job yet.</p>}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Activity history</h2></div>
          <div className="table-row">
            <div className="job-name"><b>Job requested</b></div>
            <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(job.createdAt)}</small>
          </div>
          {job.updatedAt.getTime() !== job.createdAt.getTime() && (
            <div className="table-row">
              <div className="job-name"><b>Last updated</b></div>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(job.updatedAt)}</small>
            </div>
          )}
          {job.review && (
            <div className="table-row">
              <div className="job-name"><b>Review received</b><span>{'★'.repeat(job.review.rating)} — {job.review.review ?? 'No comment left'}</span></div>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
