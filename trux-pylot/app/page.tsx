import Link from 'next/link';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, verifiedCount, completedJobsCount, customerCount] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { active: true }, take: 12, orderBy: { name: 'asc' } }),
    prisma.professional.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.job.count({ where: { status: 'SETTLED' } }),
    prisma.customer.count(),
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
        <div className="landing-hero">
          <div>
            <p className="eyebrow">TRUSTED PROFESSIONALS, READY TO WORK</p>
            <h1>Find the right professional for <em>every job.</em></h1>
            <p>Book dependable, verified experts for your home, business or estate.</p>
            <a className="primary" href="/marketplace">Find a professional →</a>
          </div>
          <div className="hero-art">
            <div className="trust-pill one"><i>✓</i>Verified pros</div>
            <div className="trust-pill two"><i>✓</i>Secure payments</div>
            <b>Trusted, verified, ready.</b>
            <p>Every professional is reviewed before they can accept a job.</p>
          </div>
        </div>

        <div className="stat-row">
          <div><b>{verifiedCount}</b><span>VERIFIED PROFESSIONALS</span></div>
          <div><b>{completedJobsCount}</b><span>JOBS COMPLETED</span></div>
          <div><b>{customerCount}</b><span>CUSTOMERS SERVED</span></div>
        </div>

        <h2 className="section-title">Explore services</h2>
        <div className="service-grid">
          {categories.map(c => (
            <a key={c.id} href={`/marketplace?category=${c.slug}`}>{c.name}</a>
          ))}
          {!categories.length && <p>Service categories are being set up. Check back soon.</p>}
        </div>
      </section>
    </main>
  );
}
