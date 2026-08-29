import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Counter } from '@/components/counter';

export const dynamic = 'force-dynamic';

const HOW_IT_WORKS = [
  { step: '01', title: 'Find a service', text: 'Search or browse by category to find the right kind of professional for your job.' },
  { step: '02', title: 'Choose a verified pro', text: 'Compare ratings, experience and completed jobs before you decide who to book.' },
  { step: '03', title: 'Book & pay securely', text: 'Confirm the job details and pay through a protected, trackable transaction.' },
  { step: '04', title: 'Get the job done', text: 'Your professional completes the work — rate and review once it is finished.' },
];

const TRUST_POINTS = [
  { icon: '✓', title: 'Verified professionals', text: 'Every professional passes an identity review before they can accept a job.' },
  { icon: '◈', title: 'Secure payments', text: 'Funds are held safely and only released once a job is confirmed complete.' },
  { icon: '★', title: 'Real customer reviews', text: 'Ratings come only from customers with a completed job on the platform.' },
  { icon: '◎', title: 'Service accountability', text: 'Every job is tracked from request to completion, with support if something goes wrong.' },
];

// Placeholder testimonials — swap for real customer quotes before launch.
const TESTIMONIALS = [
  { quote: 'I needed a plumber the same day and had someone verified at my door within hours.', name: 'Amaka O.', role: 'Homeowner, Lagos' },
  { quote: 'Managing maintenance requests for our estate used to take days. Now it takes minutes.', name: 'Tunde F.', role: 'Estate manager, Abuja' },
  { quote: 'Getting verified opened up a steady stream of jobs I would not have found on my own.', name: 'Chiamaka N.', role: 'Electrician, Port Harcourt' },
];

export default async function Home() {
  const [categories, verifiedCount, completedJobsCount, customerCount] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { active: true }, take: 12, orderBy: { name: 'asc' } }),
    prisma.professional.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.job.count({ where: { status: 'SETTLED' } }),
    prisma.customer.count(),
  ]);

  return (
    <main>
      <ScrollReveal />
      <noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript>

      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a href="#services">Services</a>
          <a href="#how-it-works">How It Works</a>
          <a href="/register">Become a Professional</a>
          <a href="/login">Log In</a>
          <a className="nav-cta" href="/register">Sign Up</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="landing">
        <div className="landing-hero">
          <div className="reveal">
            <p className="eyebrow">TRUSTED PROFESSIONALS, READY TO WORK</p>
            <h1>Find the right professional for <em>every job.</em></h1>
            <p>Book dependable, verified experts for your home, business or estate.</p>
            <a className="primary" href="/marketplace">Find a professional →</a>
          </div>
          <div className="hero-art reveal" style={{ transitionDelay: '120ms' }}>
            <div className="trust-pill one"><i>✓</i>Verified pros</div>
            <div className="trust-pill two"><i>✓</i>Secure payments</div>
            <b>Trusted, verified, ready.</b>
            <p>Every professional is reviewed before they can accept a job.</p>
          </div>
        </div>

        <div className="stat-row reveal">
          <div><b><Counter target={verifiedCount} /></b><span>VERIFIED PROFESSIONALS</span></div>
          <div><b><Counter target={completedJobsCount} /></b><span>JOBS COMPLETED</span></div>
          <div><b><Counter target={customerCount} /></b><span>CUSTOMERS SERVED</span></div>
        </div>

        {/* SERVICES */}
        <h2 className="section-title reveal" id="services">Explore services</h2>
        <div className="service-grid">
          {categories.map((c, i) => (
            <a key={c.id} href={`/marketplace?category=${c.slug}`} className="reveal" style={{ transitionDelay: `${i * 40}ms` }}>
              {c.name}
            </a>
          ))}
          {!categories.length && <p>Service categories are being set up. Check back soon.</p>}
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="band">
        <div className="landing">
          <p className="eyebrow reveal">WHY TRUX PYLOT</p>
          <h2 className="section-title reveal">Built for trust, from booking to payment.</h2>
          <div className="trust-grid">
            {TRUST_POINTS.map((t, i) => (
              <div className="trust-card reveal" key={t.title} style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="trust-icon">{t.icon}</span>
                <b>{t.title}</b>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing" id="how-it-works">
        <p className="eyebrow reveal">HOW IT WORKS</p>
        <h2 className="section-title reveal">Four steps to a job well done.</h2>
        <div className="steps-grid">
          {HOW_IT_WORKS.map((s, i) => (
            <div className="step-card reveal" key={s.step} style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="step-number">{s.step}</span>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR ESTATES */}
      <section className="landing">
        <div className="split-section reveal">
          <div>
            <p className="eyebrow">FOR ESTATES</p>
            <h2>Give your estate a trusted service network.</h2>
            <p className="split-copy">
              Equip your residents with verified professionals for maintenance and repairs,
              backed by a service history for every job requested across the estate.
            </p>
            <a className="primary" href="/register">Partner your estate with Trux Pylot →</a>
          </div>
          <ul className="split-list">
            <li>Verified service providers on call</li>
            <li>Centralized maintenance requests</li>
            <li>Full service history per resident</li>
            <li>Faster turnaround, less back-and-forth</li>
          </ul>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="band">
        <div className="landing">
          <div className="split-section reverse reveal">
            <ul className="split-list">
              <li>Repairs and facility maintenance</li>
              <li>Recurring cleaning and servicing</li>
              <li>Electrical and AC upkeep</li>
              <li>One dashboard for every request</li>
            </ul>
            <div>
              <p className="eyebrow">FOR BUSINESSES</p>
              <h2>Keep operations running, without the chasing.</h2>
              <p className="split-copy">
                Book recurring or one-off professional services for your business and track
                every request from a single place — no more chasing down contractors.
              </p>
              <a className="primary" href="/register">Get business services →</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOR PROFESSIONALS */}
      <section className="landing">
        <div className="pro-cta reveal">
          <div>
            <p className="eyebrow">FOR PROFESSIONALS</p>
            <h2>Grow your reputation. Get more jobs.</h2>
            <p className="split-copy">
              Get verified, build a rating that speaks for itself, and receive job requests
              from customers, estates and businesses actively looking for someone like you.
            </p>
            <a className="primary" href="/register">Become a Trux Pylot professional →</a>
          </div>
          <div className="pro-benefits">
            <div><b>Get verified</b><span>Stand out with a trust badge</span></div>
            <div><b>Manage jobs</b><span>Accept, quote and track in one place</span></div>
            <div><b>Get paid</b><span>Secure, tracked payments</span></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="band">
        <div className="landing">
          <p className="eyebrow reveal">WHAT PEOPLE SAY</p>
          <h2 className="section-title reveal">Real people, real jobs.</h2>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card reveal" key={t.name} style={{ transitionDelay: `${i * 80}ms` }}>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <b>{t.name}</b>
                <span>{t.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta reveal">
        <h2>Whatever the job, find someone you can trust.</h2>
        <div className="final-cta-actions">
          <a className="primary" href="/marketplace">Find a professional →</a>
          <a className="secondary" href="/register">Join as a professional</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
          <div className="footer-cols">
            <div>
              <b>Company</b>
              <a href="/#how-it-works">How It Works</a>
              <a href="/register">Become a Professional</a>
              <a href="/marketplace">For Businesses</a>
              <a href="/marketplace">For Estates</a>
            </div>
            <div>
              <b>Platform</b>
              <a href="/marketplace">Find a Professional</a>
              <a href="/#services">Services</a>
              <a href="/login">Log In</a>
              <a href="/register">Sign Up</a>
            </div>
            <div>
              <b>Support</b>
              <a href="mailto:support@truxpylot.co">Help Center</a>
              <a href="mailto:support@truxpylot.co">Contact</a>
            </div>
            <div className="footer-admin">
              <a href="/login">Admin Login</a>
            </div>
          </div>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Trux Pylot. All rights reserved.</p>
      </footer>
    </main>
  );
}
