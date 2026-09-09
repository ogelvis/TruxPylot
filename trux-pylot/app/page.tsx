import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Counter } from '@/components/counter';
import { ProPhoto } from '@/components/pro-photo';
import { getSession, dashboardPath } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PRO_ACCENTS = ['drop', 'spark', 'shield', 'drop'];

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
  const [categories, verifiedCount, completedJobsCount, customerCount, featuredPros, session] = await Promise.all([
    prisma.serviceCategory.findMany({ where: { active: true }, take: 12, orderBy: { name: 'asc' } }),
    prisma.professional.count({ where: { verificationStatus: 'APPROVED' } }),
    prisma.job.count({ where: { status: 'SETTLED' } }),
    prisma.customer.count(),
    prisma.professional.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: { rating: 'desc' },
      take: 4,
    }),
    getSession(),
  ]);

  return (
    <main className="tp-home">
      <ScrollReveal />
      <style dangerouslySetInnerHTML={{ __html: `
        .tp-home{--tp-ink:#10233f;--tp-blue:#155eef;--tp-navy:#071b49;--tp-muted:#667895;--tp-line:#dce5f2;background:#f8fbff}
        .tp-home{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
        .tp-home a{transition:color .25s ease,transform .25s ease,box-shadow .25s ease,border-color .25s ease,background .25s ease}
        .tp-nav{background:rgba(248,251,255,.78);border-bottom:1px solid rgba(180,199,227,.5);box-shadow:0 8px 30px rgba(27,62,113,.06)}
        .tp-nav-inner{height:82px}.tp-logo{display:flex;align-items:center;gap:10px}.tp-logo:after{content:'THE TRUST LAYER';font-size:8px;letter-spacing:1.5px;color:#6680a8;border-left:1px solid #d4dfed;padding-left:10px}
        .tp-links{gap:20px}.tp-links a{padding:30px 0}.tp-links a:hover{transform:translateY(-2px)}
        .tp-signup{border-radius:999px!important;padding:12px 20px!important;box-shadow:0 10px 22px rgba(21,94,239,.22)}
        .tp-hero{position:relative;padding:104px 0 0;background:radial-gradient(circle at 75% 12%,rgba(79,147,255,.18),transparent 31%),linear-gradient(145deg,#f8fbff 0%,#eef5ff 100%)}
        .tp-hero:before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.35;background-image:linear-gradient(rgba(21,94,239,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(21,94,239,.06) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(to bottom,#000,transparent 75%)}
        .tp-hero-grid,.tp-stats{position:relative;z-index:1}.tp-kicker{display:inline-flex;align-items:center;gap:9px;padding:7px 12px;border:1px solid #bdd4fa;border-radius:999px;background:#eaf2ff;letter-spacing:1.3px}
        .tp-kicker:before{content:'';width:6px;height:6px;border-radius:50%;background:#35d07f;box-shadow:0 0 0 4px #35d07f20;animation:tp-pulse 2s infinite}
        .tp-hero h1{max-width:700px;font-size:clamp(43px,6vw,76px);letter-spacing:-4px;line-height:.99}
        .tp-lede{font-size:17px;max-width:590px}.tp-actions{gap:14px}.tp-button{border-radius:999px;padding:16px 22px;box-shadow:0 14px 30px rgba(21,94,239,.28)}.tp-button:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 18px 34px rgba(21,94,239,.34)}
        .tp-text-button{padding:15px 17px;border:1px solid #cbd9ec;border-radius:999px;background:#fff}.tp-text-button:hover{border-color:#155eef;transform:translateY(-3px)}
        .tp-hero-proof{display:flex;align-items:center;gap:10px;margin-top:25px;color:#31517e;font-size:12px}.tp-hero-proof>span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;color:#155eef;background:#dbeaff}.tp-hero-proof svg{width:17px}.tp-hero-proof strong{font-size:12px;color:#183967}.tp-hero-proof small{color:#7890b0}
        .tp-hero-art{height:470px;border:1px solid rgba(135,181,255,.3);border-radius:34px;background:linear-gradient(145deg,#123d94,#071b49 70%);box-shadow:0 30px 70px rgba(9,35,93,.25);animation:tp-float 6s ease-in-out infinite}
        .tp-hero-art:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(91,160,255,.22),transparent 30%),linear-gradient(120deg,transparent 35%,rgba(255,255,255,.08),transparent 58%);animation:tp-shine 8s linear infinite}
        .tp-art-center{z-index:1;top:143px}.tp-art-center svg{background:rgba(109,169,255,.12);box-shadow:0 0 35px rgba(93,161,255,.35);animation:tp-pulse 3s infinite}.tp-art-orbit{z-index:1;animation:tp-spin 18s linear infinite}.orbit-two{animation-direction:reverse;animation-duration:27s}
        .tp-art-tag,.tp-art-label{z-index:2;backdrop-filter:blur(12px)}.tp-art-tag{border:1px solid #dbe8ff;transition:transform .3s ease}.tp-art-tag:hover{transform:translateY(-7px) rotate(-2deg)}.tag-top{animation:tp-float 5s 1s ease-in-out infinite}.tag-bottom{animation:tp-float 5s 2s ease-in-out infinite}
        .tp-stats{margin-top:78px;border:1px solid rgba(180,199,227,.8);border-radius:20px;padding:27px 0;box-shadow:0 20px 45px rgba(27,62,113,.1)}.tp-stats strong{color:#155eef;font-size:31px}
        .tp-section{padding-top:140px}.tp-section-heading h2,.tp-trust-intro h2,.tp-final-cta h2{letter-spacing:-2.8px}.tp-service-list{gap:12px}.tp-service{min-height:76px;border:1px solid #dce5f2;border-radius:16px;background:rgba(255,255,255,.68);padding:18px 20px;box-shadow:0 8px 20px rgba(27,62,113,.04)}.tp-service:hover{border-color:#76a8f7;background:#fff;color:#155eef;transform:translateY(-5px);box-shadow:0 14px 25px rgba(21,94,239,.12)}
        .tp-trust-section{background:linear-gradient(135deg,#e9f2ff,#f6f9ff)}.tp-problem-box,.tp-solution-box{border-radius:20px;box-shadow:0 15px 35px rgba(27,62,113,.07);transition:transform .3s ease,box-shadow .3s ease}.tp-problem-box:hover,.tp-solution-box:hover{transform:translateY(-6px);box-shadow:0 22px 40px rgba(27,62,113,.13)}.tp-solution-box{background:linear-gradient(145deg,#123d94,#071b49)}
        .tp-step{position:relative;padding-top:30px}.tp-step>span{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#e9f2ff;box-shadow:inset 0 0 0 1px #bfd5f7}.tp-step h3{margin-top:27px}.tp-pros{background:#f2f6fc}.tp-pro-card{overflow:hidden;border-radius:20px;border:1px solid #dce5f2;box-shadow:0 10px 25px rgba(27,62,113,.05);transition:transform .3s ease,box-shadow .3s ease}.tp-pro-card:hover{transform:translateY(-9px);box-shadow:0 22px 40px rgba(27,62,113,.14)}.tp-pro-card .tp-pro-photo{transition:transform .5s ease}.tp-pro-card:hover .tp-pro-photo{transform:scale(1.04)}
        .tp-final-cta{position:relative;overflow:hidden;background:linear-gradient(120deg,#155eef,#09235d)}.tp-final-cta:before{content:'';position:absolute;width:480px;height:480px;right:-120px;top:-260px;border:1px solid #ffffff30;border-radius:50%;box-shadow:0 0 0 55px #ffffff09,0 0 0 110px #ffffff06}.tp-final-cta>*{position:relative;z-index:1}
        .tp-footer{background:#061737}.tp-footer-bottom{border-top:1px solid #ffffff18;padding-top:20px}
        @keyframes tp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes tp-pulse{0%,100%{opacity:1}50%{opacity:.65}}@keyframes tp-spin{to{transform:translateX(-50%) rotate(360deg)}}@keyframes tp-shine{0%{transform:translateX(-100%)}45%,100%{transform:translateX(100%)}}@media(max-width:820px){.tp-logo:after{display:none}.tp-links{gap:10px;font-size:11px}.tp-links a:nth-child(-n+3){display:none}.tp-hero{padding-top:70px}.tp-hero-grid{grid-template-columns:1fr;gap:45px}.tp-hero-art{height:390px}.tp-stats{margin-top:45px}.tp-service-list,.tp-trust-grid,.tp-pro-grid{grid-template-columns:1fr 1fr}.tp-trust-intro{grid-column:1/-1}.tp-footer-grid{grid-template-columns:1fr 1fr}}@media(max-width:540px){.tp-container{width:min(100% - 28px,1160px)}.tp-nav-inner{height:70px}.tp-links a:nth-last-child(2){display:none}.tp-hero h1{letter-spacing:-2.5px}.tp-actions{align-items:stretch;flex-direction:column}.tp-button,.tp-text-button{justify-content:center}.tp-hero-art{height:350px}.orbit-two{width:480px;height:480px}.tp-stats{grid-template-columns:1fr;padding:0}.tp-stats div{padding:16px;border-right:0;border-bottom:1px solid var(--tp-line)}.tp-section{padding-top:95px;padding-bottom:85px}.tp-service-list,.tp-trust-grid,.tp-pro-grid,.tp-footer-grid{grid-template-columns:1fr}.tp-step{padding-left:0!important;padding-bottom:25px;border-right:0;border-bottom:1px solid var(--tp-line)}.tp-step:last-child{border-bottom:0}.tp-footer-grid{gap:28px}}
        @media(prefers-reduced-motion:reduce){.tp-home *,.tp-home *:before,.tp-home *:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      ` }} />
      <header className="tp-nav">
        <div className="tp-container tp-nav-inner">
          <Link href="/" className="tp-logo"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
          <nav className="tp-links" aria-label="Main navigation">
            <Link href="/marketplace">Find a professional</Link>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/register">Become a professional</Link>
            <Link href="/support">Contact</Link>
            {session ? (
              <Link href={dashboardPath(session.role)} className="tp-signup">Open dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="tp-login">Log in</Link>
                <Link href="/register" className="tp-signup">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="tp-hero">
        <div className="tp-container tp-hero-grid">
          <div className="reveal">
            <p className="tp-kicker">THE TRUSTED PROFESSIONAL NETWORK</p>
            <h1>The right person for the job is closer than you think.</h1>
            <p className="tp-lede">From a leaking tap to a full estate maintenance team, find verified people who show up and stand behind their work.</p>
            <div className="tp-hero-proof"><span><Mark type="shield" /></span><strong>Built for confidence</strong><small>Verified pros · secure bookings · real accountability</small></div>
            <div className="tp-actions">
              <Link href="/marketplace" className="tp-button">Find a professional <span>↗</span></Link>
              <Link href="/register" className="tp-text-button">Join the network</Link>
            </div>
            <p className="tp-assurance"><span><Mark type="check" /></span> Identity-checked professionals across Nigeria</p>
          </div>
          <div className="tp-hero-art reveal" style={{ transitionDelay: '120ms' }} aria-label="Trux Pylot trust and availability overview">
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
        <div className="tp-container tp-unique-strip reveal">
          <Link href="/marketplace?emergency=1"><span>⚡</span><strong>Need urgent help?</strong><small>Activate emergency matching</small></Link>
          <Link href="/marketplace"><span>◎</span><strong>Trust, not guesswork</strong><small>Compare verified work signals</small></Link>
          <Link href="/support"><span>☎</span><strong>Human support</strong><small>Our CSD team helps you choose</small></Link>
        </div>
      </section>

      <section className="tp-section tp-container" id="services">
        <div className="tp-section-heading reveal"><p className="tp-kicker">START WITH THE JOB</p><h2>Whatever needs doing.</h2><p>One place to find the people who can do it properly.</p></div>
        <div className="tp-service-list">
          {categories.map((category, index) => <Link href={`/marketplace?category=${category.slug}`} key={category.id} className="tp-service reveal" style={{ transitionDelay: `${index * 35}ms` }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{category.name}</strong><b>↗</b></Link>)}
          {!categories.length && <p className="tp-muted">Service categories are being set up. Check back soon.</p>}
        </div>
      </section>

      <section className="tp-growth-section" id="grow-your-visibility">
        <div className="tp-container">
          <div className="tp-growth-heading reveal">
            <div>
              <p className="tp-kicker">GROW YOUR VISIBILITY</p>
              <h2>Grow Your Visibility &amp; Unlock More.</h2>
              <p>Build a stronger presence on Trux Pylot with three distinct ways to upgrade, promote, or advertise your business.</p>
            </div>
            <span className="tp-growth-note"><span className="tp-live-dot" /> Built for professionals</span>
          </div>

          <div className="tp-growth-grid">
            <article className="tp-growth-card reveal">
              <div className="tp-growth-icon tp-growth-icon-upgrade" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/><path d="M5 19h14"/></svg>
              </div>
              <div className="tp-growth-card-top"><span className="tp-growth-label">ACCOUNT ADVANCEMENT</span><span className="tp-growth-index">01</span></div>
              <h3>Tier Upgrade</h3>
              <p>Upgrade your professional standing and unlock additional capabilities available to your selected tier.</p>
              <ul>
                <li>Unlock additional profile features</li>
                <li>Access higher-tier benefits</li>
                <li>Increase your business visibility</li>
                <li>Unlock additional platform capabilities</li>
                <li>Access features available to your selected tier</li>
              </ul>
              <Link href="/dashboard/professional/tier" className="tp-growth-cta">View Upgrade Options <span>↗</span></Link>
            </article>

            <article className="tp-growth-card tp-growth-card-featured reveal" style={{ transitionDelay: '80ms' }}>
              <div className="tp-growth-featured-badge">VISIBILITY BOOST</div>
              <div className="tp-growth-icon tp-growth-icon-top10" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 16 5-5 4 3 7-8"/><path d="M15 6h5v5"/><path d="M4 20h16"/></svg>
              </div>
              <div className="tp-growth-card-top"><span className="tp-growth-label">SEARCH VISIBILITY</span><span className="tp-growth-index">02</span></div>
              <h3>Top 10 Profile Placement</h3>
              <p>Promote your profile for greater search visibility. Top 10 placement is separate from your account tier.</p>
              <ul>
                <li>Get your profile featured among the Top 10</li>
                <li>Increase your visibility in search</li>
                <li>Reach more potential customers</li>
                <li>Give your business greater exposure</li>
                <li>Improve your chances of being discovered</li>
              </ul>
              <Link href="/dashboard/professional/wallet?promotion=top10" className="tp-growth-cta tp-growth-cta-primary">Get Top 10 Placement <span>↗</span></Link>
              <small className="tp-growth-footnote">Promotion is independent of Tier Upgrade, Score, Level and organic ranking.</small>
            </article>

            <article className="tp-growth-card reveal" style={{ transitionDelay: '160ms' }}>
              <div className="tp-growth-icon tp-growth-icon-advert" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 11 16-6v14L4 13v-2Z"/><path d="M8 14.5 9.5 20"/><path d="M20 9v6"/></svg>
              </div>
              <div className="tp-growth-card-top"><span className="tp-growth-label">DIRECT ADVERTISING</span><span className="tp-growth-index">03</span></div>
              <h3>Instant Advert</h3>
              <p>Put your business directly in front of Trux Pylot users with a paid advertising package.</p>
              <div className="tp-advert-prices">
                <div><span>1 Month</span><strong>₦2,000</strong></div>
                <div><span>2 Months</span><strong>₦3,500</strong></div>
                <div><span>3 Months</span><strong>₦5,000</strong></div>
              </div>
              <ul>
                <li>Promote your business instantly</li>
                <li>Increase your brand visibility</li>
                <li>Reach more potential customers</li>
                <li>Keep your business in front of users</li>
                <li>Choose the duration that works for you</li>
              </ul>
              <Link href="/dashboard/professional/wallet?promotion=advert" className="tp-growth-cta">Advertise Now <span>↗</span></Link>
            </article>
          </div>
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
        <div className="tp-container">
          <div className="tp-section-heading reveal"><p className="tp-kicker">PEOPLE BEHIND THE WORK</p><h2>Meet professionals ready to help.</h2><p>Real skills, local knowledge and a reputation to protect.</p></div>
          {featuredPros.length > 0 ? (
            <div className="tp-pro-grid">
              {featuredPros.map((pro, index) => (
                <Link href={`/marketplace/${pro.id}`} className="tp-pro-card reveal" key={pro.id} style={{ transitionDelay: `${index * 70}ms` }}>
                  <ProPhoto src={pro.avatarUrl} alt={`${pro.fullName}, ${pro.profession ?? 'professional'}`} accent={PRO_ACCENTS[index % PRO_ACCENTS.length]} />
                  <div><strong>{pro.fullName}</strong><span>{pro.profession ?? 'Professional'}</span><small><Mark type="check" /> Verified professional</small></div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="tp-muted" style={{ marginTop: 30 }}>
              Be one of our first verified professionals — <Link href="/register">join Trux Pylot</Link> and get discovered here.
            </p>
          )}
        </div>
      </section>

      <section className="tp-final-cta reveal"><div className="tp-container"><p className="tp-kicker">YOUR NEXT JOB STARTS HERE</p><h2>Stop guessing. Start with someone you can trust.</h2><Link href="/marketplace" className="tp-button light">Find a professional <span>↗</span></Link></div></section>

      <footer className="tp-footer"><div className="tp-container tp-footer-grid"><div><Link href="/" className="tp-logo"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link><p>Trusted professionals, connected to the people who need them.</p></div><div><strong>Explore</strong><Link href="/marketplace">Find a professional</Link><a href="#services">Services</a><a href="#how-it-works">How it works</a></div><div><strong>Join Trux Pylot</strong><Link href="/register">Become a professional</Link><Link href="/login">Log in</Link><Link href="/register">Sign up</Link></div><div><strong>Support</strong><Link href="/support">Talk to an agent</Link><Link href="/privacy">Privacy policy</Link><a href="mailto:info@truxpylot.com">info@truxpylot.com</a><a href="tel:+2348054306905">+234 805 430 6905</a><Link href="/support">Contact & complaints</Link></div></div><div className="tp-container tp-footer-bottom"><span>© {new Date().getFullYear()} Trux Pylot</span><span>Built for reliable work across Nigeria.</span></div></footer>
    </main>
  );
}
