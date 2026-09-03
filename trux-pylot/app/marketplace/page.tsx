import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { RequestJobForm } from '@/components/request-job-form';

export const dynamic = 'force-dynamic';

export default async function ProfessionalProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: { services: { include: { category: true } }, reviews: { include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 6 } },
  });
  if (!professional || professional.verificationStatus !== 'APPROVED') notFound();

  const session = await getSession();

  return (
    <main>
      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="landing" style={{ paddingTop: 40 }}>
        <Link href="/marketplace" className="back-link">← Back to marketplace</Link>

        <div className="detail-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
          <div>
            <div className="professional-card-head" style={{ marginBottom: 6 }}>
              <b style={{ fontSize: 26, fontFamily: 'Manrope' }}>{professional.fullName}</b>
              <span className="verified-badge">✓ Verified</span>
            </div>
            <p className="professional-meta">{professional.profession} · {professional.location}</p>
            <p className="professional-meta">★ {professional.rating.toFixed(1)} · {professional.completedJobs} completed jobs · {professional.yearsExperience ?? 0} yrs experience</p>

            {professional.services.length > 0 && (
              <div className="professional-tags" style={{ margin: '14px 0' }}>
                {professional.services.map(s => <span key={s.id} className="tag">{s.category.name}</span>)}
              </div>
            )}

            {professional.bio && (
              <section className="panel" style={{ marginTop: 20 }}>
                <div className="panel-head"><h2>About</h2></div>
                <div className="job-detail-body"><p>{professional.bio}</p></div>
              </section>
            )}

            <section className="panel" style={{ marginTop: 20 }}>
              <div className="panel-head"><h2>Reviews</h2></div>
              {professional.reviews.length ? professional.reviews.map(r => (
                <div className="table-row review-row" key={r.id}>
                  <div className="job-name"><b>{r.customer.fullName}</b><span>{r.review ?? 'No comment left'}</span></div>
                  <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(r.createdAt)}</small>
                </div>
              )) : <div className="empty">No reviews yet.</div>}
            </section>
          </div>

          <section className="panel">
            <div className="panel-head"><h2>Request this professional</h2></div>
            <div className="job-detail-body">
              {!professional.services.length ? (
                <p>This professional hasn&apos;t listed any services yet.</p>
              ) : !session ? (
                <>
                  <p style={{ marginBottom: 14 }}>Sign in as a customer to send a job request.</p>
                  <a className="primary" href="/login">Sign in →</a>
                </>
              ) : session.role !== 'CUSTOMER' ? (
                <p>Only customer accounts can request a job. Sign in with a customer account to continue.</p>
              ) : (
                <RequestJobForm
                  professionalId={professional.id}
                  services={professional.services.map(s => ({ categoryId: s.categoryId, categoryName: s.category.name }))}
                />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
