import Link from 'next/link';

function ShieldCheck() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="tp404-svg">
      <path d="M24 4 40 10v11c0 10.4-6.8 18.9-16 23C14.8 39.9 8 31.4 8 21V10l16-6Z" fill="currentColor" opacity=".14" />
      <path d="M24 7 37 12v9c0 8.5-5.3 15.6-13 19.6C16.3 36.6 11 29.5 11 21v-9l13-5Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="m17.5 23.5 4.2 4.2 8.8-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="tp404-route-svg">
      <circle cx="40" cy="40" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" />
      <path d="M26 28h22a7 7 0 0 1 7 7v2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m51 33 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M54 52H32a7 7 0 0 1-7-7v-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m29 47-4-4-4 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="40" r="5" fill="currentColor" />
    </svg>
  );
}

const benefits = [
  ['01', 'Build trust', 'A verified profile gives customers confidence in who they hire.'],
  ['02', 'Get discovered', 'Approved professionals can appear as trusted options in the marketplace.'],
  ['03', 'Grow opportunities', 'A complete, verified presence helps you build your professional reputation.'],
];

export default function NotFound() {
  return (
    <main className="tp404-page">
      <div className="tp404-grid" aria-hidden="true" />
      <div className="tp404-glow tp404-glow-a" aria-hidden="true" />
      <div className="tp404-glow tp404-glow-b" aria-hidden="true" />

      <header className="tp404-header">
        <Link href="/" className="tp404-brand" aria-label="TruxPylot home">
          <span className="tp404-brand-mark">TP</span>
          <span><b>TRUX</b><strong>PYLOT</strong></span>
        </Link>
        <div className="tp404-header-links">
          <Link href="/marketplace">Find professionals</Link>
          <Link href="/login" className="tp404-login">Log in</Link>
        </div>
      </header>

      <section className="tp404-main">
        <div className="tp404-copy">
          <div className="tp404-status"><span className="tp404-status-dot" /> PROFILE NOT AVAILABLE</div>

          <div className="tp404-number" aria-label="Error 404">
            <span>4</span><span className="tp404-zero">0</span><span>4</span>
          </div>

          <h1>This profile isn&apos;t available yet.</h1>
          <p className="tp404-lead">
            This professional profile may be waiting for approval, unavailable, or no longer active. Public marketplace profiles are reserved for approved TruxPylot professionals.
          </p>

          <div className="tp404-callout">
            <div className="tp404-callout-icon"><ShieldCheck /></div>
            <div>
              <b>Verification opens the door to more.</b>
              <span>Build credibility, become easier to discover and be part of a trusted professional community.</span>
            </div>
          </div>

          <div className="tp404-actions">
            <Link href="/marketplace" className="tp404-primary">Back to marketplace <span>→</span></Link>
            <Link href="/register" className="tp404-secondary">Become verified</Link>
          </div>
        </div>

        <div className="tp404-visual" aria-hidden="true">
          <div className="tp404-visual-card">
            <div className="tp404-visual-top">
              <span className="tp404-mini-label">TRUXPYLOT</span>
              <span className="tp404-live"><i /> TRUSTED NETWORK</span>
            </div>
            <div className="tp404-route-art">
              <div className="tp404-orbit orbit-1" />
              <div className="tp404-orbit orbit-2" />
              <div className="tp404-orbit orbit-3" />
              <div className="tp404-route-icon"><RouteIcon /></div>
              <div className="tp404-floating-dot dot-1" />
              <div className="tp404-floating-dot dot-2" />
              <div className="tp404-floating-dot dot-3" />
              <div className="tp404-404-chip">404</div>
            </div>
            <div className="tp404-card-footer">
              <div className="tp404-profile-placeholder"><span>TP</span></div>
              <div><b>Profile unavailable</b><small>Verification required for public access</small></div>
              <span className="tp404-lock">●</span>
            </div>
          </div>
          <div className="tp404-verified-pill"><ShieldCheck /><span><b>Verified professionals</b><small>Trusted. Visible. Ready.</small></span></div>
        </div>
      </section>

      <section className="tp404-benefits">
        <div className="tp404-benefit-heading">
          <span>WHY VERIFICATION MATTERS</span>
          <h2>More than a badge.</h2>
          <p>Verification helps create a safer, more trusted marketplace for everyone.</p>
        </div>
        <div className="tp404-benefit-list">
          {benefits.map(([number, title, text]) => (
            <article key={number} className="tp404-benefit-item">
              <span className="tp404-benefit-number">{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <span className="tp404-benefit-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="tp404-footer">
        <span>TRUXPYLOT</span>
        <span>Trusted people. Real services.</span>
        <Link href="/verification">Learn about verification →</Link>
      </footer>
    </main>
  );
}
