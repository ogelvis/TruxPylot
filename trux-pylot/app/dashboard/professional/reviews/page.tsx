import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function Reviews() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return null;

  const reviews = await prisma.review.findMany({
    where: { professionalId: professional.id },
    include: { customer: true, job: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const total = reviews.length;
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fiveStarPct = total ? Math.round((fiveStarCount / total) * 100) : 0;

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/reviews">
      <main className="dash-page">
        <h1>What your customers are saying.</h1>
        <p className="subcopy">Reviews are only left by customers with a completed, paid job.</p>

        <section className="metrics">
          <div className="metric"><span>Overall rating</span><b>{professional.rating.toFixed(1)} ★</b><small>Across all jobs</small></div>
          <div className="metric"><span>Number of reviews</span><b>{total}</b><small>All time</small></div>
          <div className="metric"><span>5-star reviews</span><b>{fiveStarPct}%</b><small>{fiveStarCount} of {total}</small></div>
          <div className="metric"><span>Completed jobs</span><b>{professional.completedJobs}</b><small>Verified work</small></div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Recent reviews</h2></div>
          {reviews.length ? reviews.map(r => (
            <div className="table-row review-row" key={r.id}>
              <div className="job-name">
                <b>{r.customer.fullName}</b>
                <span>{r.job.category.name} · {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(r.createdAt)}</span>
              </div>
              <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <small>{r.review ?? 'No comment left'}</small>
            </div>
          )) : <div className="empty">No reviews yet. They will appear here after your first completed job.</div>}
        </section>
      </main>
    </AppShell>
  );
}
