import Link from 'next/link';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export default async function Marketplace({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
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
          Browse verified professionals ready to help with your next job.
        </p>

        <nav className="category-filters">
          <a href="/marketplace" className={!category ? 'active' : ''}>All services</a>
          {categories.map(c => (
            
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
      </section>
    </main>
  );
}
