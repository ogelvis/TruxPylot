import Link from 'next/link';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export default async function Marketplace({ searchParams }: { searchParams: Promise<{ category?: string; emergency?: string }> }) {
  const { category, emergency } = await searchParams;
  const [professionals, categories] = await Promise.all([
    prisma.professional.findMany({
      where: {
        verificationStatus: 'APPROVED',
        services: category ? { some: { category: { slug: category } } } : undefined,
      },
      include: { services: { include: { category: true } }, user: true },
      take: 30,
    }),
    prisma.serviceCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <main>
      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="landing">
        <p className="eyebrow">MARKETPLACE</p>
        <h1 className="section-title">Find a trusted professional</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
          Browse verified professionals ready to help, with accountability built into every request.
        </p>
        <div className="marketplace-trust-bar">
          <span>✓ Identity checked</span><span>★ Trust scores from real work</span><span>☎ CSD-reviewed requests</span>
        </div>
        {emergency === '1' && (
          <div className="marketplace-emergency">
            <strong>Emergency help mode</strong>
            <span>Tell us what happened and our Customer Service team will prioritise matching you with an available professional.</span>
          </div>
        )}

        <nav className="category-filters">
          <a href="/marketplace" className={!category ? 'active' : ''}>All services</a>
          {categories.map(c => (
            <a
              key={c.id}
              href={'/marketplace?category=' + c.slug}
              className={category === c.slug ? 'active' : ''}
            >
              {c.name}
            </a>
          ))}
        </nav>

        <div className="professional-grid">
          {professionals.map(p => (
            <Link key={p.id} href={'/marketplace/' + p.id} className="professional-card">
              <div className="professional-card-head">
                <b>{p.fullName}</b>
                <span className="verified-badge">✓ Verified</span>
              </div>
              <div className="professional-trust-row">
                <strong>Trust score {Math.min(99, Math.round(60 + p.rating * 7 + Math.min(p.completedJobs, 20) * 1.2))}/100</strong>
                {p.completedJobs >= 10 && <span>Reliable</span>}
                {p.rating >= 4.5 && <span>Top rated</span>}
              </div>
              <p className="professional-meta">{p.profession} · {p.location}</p>
              <p className="professional-meta">★ {p.rating.toFixed(1)} · {p.completedJobs} completed jobs</p>
              {p.services.length > 0 && (
                <div className="professional-tags">
                  {p.services.map(s => (
                    <span key={s.id} className="tag">{s.category.name}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          {!professionals.length && (
            <div className="empty">No approved professionals match this service yet.</div>
          )}
        </div>
        <div className="marketplace-concierge">
          <div><p className="eyebrow">CAN&apos;T DECIDE?</p><h2>Let Trux Pylot match you.</h2><p>Send one request to our Customer Service team and we&apos;ll help identify the right available professional.</p></div>
          <a className="primary" href="/support">Talk to our CSD team →</a>
        </div>
      </section>
    </main>
  );
}
