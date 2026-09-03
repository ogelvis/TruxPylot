import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Counter } from '@/components/counter';
import { ProPhoto } from '@/components/pro-photo';

export const dynamic = 'force-dynamic';

const FEATURED_PROS = [
  { name: 'Blessing A.', trade: 'Electrician', image: '/images/professionals/electrician.jpg', accent: 'bolt' },
  { name: 'Ifeanyi O.', trade: 'Plumber', image: '/images/professionals/plumber.jpg', accent: 'drop' },
  { name: 'Ngozi E.', trade: 'Cleaning specialist', image: '/images/professionals/cleaner.jpg', accent: 'spark' },
  { name: 'David K.', trade: 'Security personnel', image: '/images/professionals/security.jpg', accent: 'shield' },
];

const HOW_IT_WORKS = [
  ['01', 'Tell us what you need', 'Choose a service and share a few details about the job.'],
  ['02', 'Meet the right pro', 'Review verified profiles, ratings and experience before you choose.'],
  ['03', 'Track it through', 'Book securely, follow progress and leave a review when it is done.'],
];

function Mark({ type }: { type: 'check' | 'shield' | 'search' | 'clock' | 'star' }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (type === 'shield') return <svg {...common}><path d="M12 3 19 6v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>;
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  return <svg {...common}><path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.5l6.3-.9L12 3Z" /></svg>;
}

export default async function Home() {
  const [categories, verifiedCount, completedJobsCount, customerCount] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { active: true }, take: 12, orderBy: { name: 'asc' } }),
    prisma.professional.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.job.count({ where: { status: 'SETTLED' } }),
    prisma.customer.count(),
  ]);

  return (
    <main className="tp-home">
      <ScrollReveal />
      <header className="tp-nav">
        <div className="tp-container tp-nav-inner">
          <Link href="/" className="tp-logo"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
          <nav className="tp-links" aria-label="Main navigation">
            <Link href="/marketplace">Find a professional</Link>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/register">Become a professional</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/login" className="tp-login">Log in</Link>
            <Link href="/register" className="tp-signup">Sign up</Link>
          </nav>
        </div>
      </header>

      <section className="tp-hero">
        <div className="tp-container tp-hero-grid">
          <div className="reveal">
            <p className="tp-kicker">THE TRUSTED PROFESSIONAL NETWORK</p>
            <h1>The right person for the job is closer than you think.</h1>
            <p className="tp-lede">From a leaking tap to a full estate maintenance team, find verified people who show up and stand behind their work.</p>
            <div className="tp-actions">
              <Link href="/marketplace" className="tp-button">Find a professional <span>↗</span></Link>
              <Link href="/register" className="tp-text-button">Join the network</Link>
            </div>
            <p className="tp-assurance"><span><Mark type="check" /></span> Identity-checked professionals across Nigeria</p>
          </div>
          <div className="tp-hero-art reveal" style={{ transitionDelay: '120ms' }}>
            <div className="tp-art-label"><span className="tp-live-dot" /> Available now</div>
            <div className="tp-art-orbit orbit-one" /><div className="tp-art-orbit orbit-two" />
            <div className="tp-art-center"><Mark type="shield" /><strong>TRUST<br />THE WORK</strong><small>Verified by Trux Pylot</small></div>
            <div className="tp-art-tag tag-top"><b>4.9</b><span><Mark type="star" /></span><small>customer rating</small></div>
            <div className="tp-art-tag tag-bottom"><Mark type="clock" /><span><b>Tracked jobs</b><small>from request to done</small></span></div>
          </div>
        </div>
        <div className="tp-container tp-stats reveal">
          <div><strong><Counter target={verifiedCount} /></strong><span>verified professionals</span></div>
          <div><strong><Counter target={completedJobsCount} /></strong><span>jobs completed</span></div>
          <div><strong><Counter target={customerCount} /></strong><span>customers served</span></div>
        </div>
      </section>

      <section className="tp-section tp-container" id="services">
        <div className="tp-section-heading reveal"><p className="tp-kicker">START WITH THE JOB</p><h2>Whatever needs doing.</h2><p>One place to find the people who can do it properly.</p></div>
        <div className="tp-service-list">
          {categories.map((category, index) => <Link href={`/marketplace?category=${category.slug}`} key={category.id} className="tp-service reveal" style={{ transitionDelay: `${index * 35}ms` }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{category.name}</strong><b>↗</b></Link>)}
          {!categories.length && <p className="tp-muted">Service categories are being set up. Check back soon.</p>}
        </div>
      </section>

      <section className="tp-trust-section">
        <div className="tp-container tp-trust-grid">
          <div className="tp-trust-intro reveal"><p className="tp-kicker">THE PROBLEM WITH FINDING HELP</p><h2>Good work should not feel like a gamble.</h2><p>Calling around, hoping for the best, then having no one to call when it goes wrong — that is the old way.</p></div>
          <div className="tp-problem-box reveal"><div className="tp-box-heading"><span className="tp-box-icon problem"><Mark type="search" /></span><h3>Without a trusted network</h3></div><ul><li>Who is actually qualified?</li><li>What happens when the job is poorly done?</li><li>How much time and money will be lost?</li></ul></div>
          <div className="tp-solution-box reveal"><div className="tp-box-heading"><span className="tp-box-icon solution"><Mark type="shield" /></span><h3>With Trux Pylot</h3></div><ul><li>Verified professionals you can identify</li><li>Real reviews from completed jobs</li><li>Secure, tracked service with accountability</li></ul></div>
        </div>
      </section>

      <section className="tp-section tp-container" id="how-it-works">
        <div className="tp-section-heading reveal"><p className="tp-kicker">A BETTER WAY TO GET THINGS DONE</p><h2>Simple from first search to final review.</h2></div>
        <div className="tp-steps">{HOW_IT_WORKS.map(([number, title, text], index) => <article className="tp-step reveal" key={number} style={{ transitionDelay: `${index * 80}ms` }}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="tp-pros">
        <div className="tp-container"><div className="tp-section-heading reveal"><p className="tp-kicker">PEOPLE BEHIND THE WORK</p><h2>Meet professionals ready to help.</h2><p>Real skills, local knowledge and a reputation to protect.</p></div><div className="tp-pro-grid">{FEATURED_PROS.map((pro, index) => <article className="tp-pro-card reveal" key={pro.name} style={{ transitionDelay: `${index * 70}ms` }}><ProPhoto src={pro.image} alt={`${pro.name}, ${pro.trade}`} accent={pro.accent} /><div><strong>{pro.name}</strong><span>{pro.trade}</span><small><Mark type="check" /> Verified professional</small></div></article>)}</div></div>
      </section>

      <section className="tp-final-cta reveal"><div className="tp-container"><p className="tp-kicker">YOUR NEXT JOB STARTS HERE</p><h2>Stop guessing. Start with someone you can trust.</h2><Link href="/marketplace" className="tp-button light">Find a professional <span>↗</span></Link></div></section>

      <footer className="tp-footer"><div className="tp-container tp-footer-grid"><div><Link href="/" className="tp-logo"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link><p>Trusted professionals, connected to the people who need them.</p></div><div><strong>Explore</strong><Link href="/marketplace">Find a professional</Link><a href="#services">Services</a><a href="#how-it-works">How it works</a></div><div><strong>Join Trux Pylot</strong><Link href="/register">Become a professional</Link><Link href="/login">Log in</Link><Link href="/register">Sign up</Link></div><div><strong>Support</strong><a href="mailto:info@truxpylot.com">info@truxpylot.com</a><a href="tel:+2348054306905">+234 805 430 6905</a><Link href="/contact">Contact & complaints</Link></div></div><div className="tp-container tp-footer-bottom"><span>© {new Date().getFullYear()} Trux Pylot</span><span>Built for reliable work across Nigeria.</span></div></footer>
    </main>
  );
}
