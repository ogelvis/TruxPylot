import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { RequestServiceForm } from '@/components/request-service-form';
import { ReportProfessionalForm } from '@/components/report-professional-form';

export const dynamic = 'force-dynamic';

const monthYearFmt = new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' });
const dateFmt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' });

export default async function ProfessionalProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [professional, reviewCount, jobCount, approvedRequest] = await Promise.all([
    prisma.professional.findUnique({
      where: { id },
      include: {
        services: { include: { category: true } },
        reviews: { include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 8 },
      },
    }),
    prisma.review.count({ where: { professionalId: id } }),
    prisma.job.count({ where: { professionalId: id } }),
    prisma.verificationRequest.findFirst({
      where: { professionalId: id, status: 'APPROVED' },
      orderBy: { reviewedAt: 'desc' },
    }),
  ]);
  if (!professional || professional.verificationStatus !== 'APPROVED') notFound();

  const session = await getSession();
  const tsid = 'TSID-' + professional.id.slice(-8).toUpperCase();
  const approvedBatch = approvedRequest?.reviewedAt ? monthYearFmt.format(approvedRequest.reviewedAt) : null;
  const completionRate = jobCount > 0 ? Math.round((professional.completedJobs / jobCount) * 100) : null;
  const displayName = professional.accountType === 'BUSINESS' ? (professional.businessName || professional.fullName) : professional.fullName;

  const whyChoose = [
    'Truxpylot Verified professional',
    `${professional.completedJobs} job${professional.completedJobs === 1 ? '' : 's'} completed on Truxpylot`,
    reviewCount > 0 ? `${professional.rating.toFixed(1)} average rating from ${reviewCount} review${reviewCount === 1 ? '' : 's'}` : null,
    professional.services.length > 0 ? `Approved for ${professional.services.length} service${professional.services.length === 1 ? '' : 's'}` : null,
    professional.location ? `Serves ${professional.location}` : null,
    professional.yearsExperience ? `${professional.yearsExperience} year${professional.yearsExperience === 1 ? '' : 's'} of experience` : null,
    completionRate !== null ? `${completionRate}% job completion rate` : null,
  ].filter(Boolean) as string[];

  return (
    <main>
      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="landing" style={{ paddingTop: 30 }}>
        <Link href="/marketplace" className="back-link">← Back to marketplace</Link>

        <div className="pro-hero">
          <div className="pro-hero-top">
            <span className="pro-hero-avatar">
              {professional.avatarUrl ? <img src={professional.avatarUrl} alt={displayName} /> : displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <div>
              <p className="pro-hero-name">{displayName}</p>
              <p className="pro-hero-meta">
                {professional.profession ?? 'Professional'}
                {professional.state ? ` · ${professional.state}` : ''}
                {professional.location ? ` · Serves ${professional.location}` : ''}
              </p>
            </div>
          </div>
          <div className="pro-hero-badges">
            <span className="pro-credential brass">✓ Truxpylot Verified</span>
            <span className="pro-credential">{tsid}</span>
            {approvedBatch && <span className="pro-credential">Approved {approvedBatch}</span>}
          </div>
        </div>

        <div className="pro-stats">
          <div className="pro-stat"><b>{professional.rating.toFixed(1)}</b><span>★ Rating · {reviewCount} review{reviewCount === 1 ? '' : 's'}</span></div>
          <div className="pro-stat"><b>{professional.completedJobs}</b><span>Jobs completed</span></div>
          <div className="pro-stat"><b>{professional.services.length}</b><span>Service{professional.services.length === 1 ? '' : 's'} offered</span></div>
          <div className="pro-stat"><b>{professional.yearsExperience ?? '—'}</b><span>Years of experience</span></div>
        </div>

        <div className="detail-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
          <div>
            {professional.bio && (
              <section className="panel">
                <div className="panel-head"><h2>About</h2></div>
                <div className="job-detail-body"><p>{professional.bio}</p></div>
              </section>
            )}

            {professional.services.length > 0 && (
              <section className="panel">
                <div className="panel-head"><h2>Services offered</h2></div>
                <div className="job-detail-body">
                  <div className="professional-tags">
                    {professional.services.map(s => (
                      <span key={s.id} className="tag">
                        {s.category.name}{s.startingPrice ? ` · from ₦${(s.startingPrice / 100).toLocaleString()}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="panel">
              <div className="panel-head"><h2>Why choose {displayName.split(' ')[0]}?</h2></div>
              <div className="job-detail-body">
                <ul className="pro-why">
                  {whyChoose.map(reason => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Customer reviews</h2></div>
              {reviewCount > 0 && (
                <div className="review-summary">
                  <b>{professional.rating.toFixed(1)}</b>
                  <div>
                    <span className="review-stars">{'★'.repeat(Math.round(professional.rating))}{'☆'.repeat(5 - Math.round(professional.rating))}</span>
                    <span>Based on {reviewCount} verified job{reviewCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              )}
              {professional.reviews.length ? professional.reviews.map(r => (
                <div className="table-row review-row" key={r.id}>
                  <div className="job-name"><b>{r.customer.fullName}</b><span>{r.review ?? 'No comment left'}</span></div>
                  <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <small>{dateFmt.format(r.createdAt)}</small>
                </div>
              )) : <div className="empty">No reviews yet.</div>}
            </section>
          </div>

          <div>
            <section className="panel request-service-card">
              <div className="panel-head"><h2>Request this service</h2></div>
              <div className="job-detail-body">
                {!professional.services.length ? (
                  <p>This professional hasn&apos;t listed any services yet.</p>
                ) : !session ? (
                  <>
                    <p style={{ marginBottom: 14 }}>Sign in as a customer to request this service.</p>
                    <a className="primary" href="/login">Sign in →</a>
                  </>
                ) : session.role !== 'CUSTOMER' ? (
                  <p>Only customer accounts can request a service. Sign in with a customer account to continue.</p>
                ) : (
                  <RequestServiceForm
                    professionalId={professional.id}
                    services={professional.services.map(s => ({ categoryId: s.categoryId, categoryName: s.category.name }))}
                  />
                )}
              </div>
            </section>

            {session?.role === 'CUSTOMER' && (
              <section className="panel">
                <div className="job-detail-body">
                  <ReportProfessionalForm professionalId={professional.id} />
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
