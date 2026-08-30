import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function CustomerJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('CUSTOMER');
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) notFound();

  const job = await prisma.job.findFirst({
    where: { id, customerId: customer.id },
    include: { professional: true, category: true, payment: true, review: true },
  });
  if (!job) notFound();

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} active="/dashboard/customer/jobs">
      <main className="dash-page">
        <Link href="/dashboard/customer/jobs" className="back-link">← Back to my requests</Link>
        <div className="overview-top">
          <div>
            <p className="page-kicker">REQUEST #{job.id.slice(-6).toUpperCase()}</p>
            <h1>{job.category.name}</h1>
          </div>
          <span className={`status ${job.status.toLowerCase()}`}>{job.status.replaceAll('_', ' ')}</span>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>What you asked for</h2></div>
          <div className="job-detail-body"><p>{job.description}</p></div>
        </section>

        <section className="detail-grid">
          <div className="panel">
            <div className="panel-head"><h2>Professional</h2></div>
            <div className="job-detail-body">
              {job.professional ? (
                <>
                  <p><b>{job.professional.fullName}</b></p>
                  <p>{job.professional.profession ?? 'Not specified'}</p>
                </>
              ) : <p>Still finding a matching professional.</p>}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Schedule &amp; budget</h2></div>
            <div className="job-detail-body">
              <p>Preferred date: {job.preferredAt ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(job.preferredAt) : 'Flexible'}</p>
              <p>Budget: {job.budget ? `₦${job.budget.toLocaleString()}` : 'Not specified'}</p>
              <p>Location: {job.location}</p>
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
              ) : <p>No payment made for this request yet.</p>}
            </div>
          </div>
        </section>

        {job.review && (
          <section className="panel">
            <div className="panel-head"><h2>Your review</h2></div>
            <div className="job-detail-body">
              <p>{'★'.repeat(job.review.rating)}{'☆'.repeat(5 - job.review.rating)}</p>
              <p>{job.review.review ?? 'No comment left'}</p>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
