import Link from 'next/link';

function SupportIcon({ type }: { type: 'mail' | 'chat' | 'phone' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>;
  if (type === 'chat') return <svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-8.9 8.36 8.5 8.5 0 0 1-3.8-.9L3 20l1.06-4.13A8.5 8.5 0 1 1 21 11.5Z" /></svg>;
  return <svg {...common}><path d="M15.5 17.5c-4.7 0-9-4.3-9-9 0-1.4.6-2.7 1.6-3.7l1.1-1.1a1 1 0 0 1 1.5.1l2 2.6a1 1 0 0 1-.1 1.3L11 9.4c.6 1.5 1.7 2.6 3.2 3.2l1.7-1.6a1 1 0 0 1 1.3-.1l2.6 2a1 1 0 0 1 .1 1.5l-1.1 1.1c-1 1-2.3 1.6-3.7 1.6Z" /></svg>;
}

export default function Support() {
  return (
    <main>
      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="landing support-page" style={{ maxWidth: 720 }}>
        <p className="eyebrow">SUPPORT</p>
        <h1 style={{ fontSize: 38 }}>Talk to a Truxpylot agent</h1>
        <p style={{ marginBottom: 30 }}>Have a question about a request, a payment, or your account? Our team is here to help.</p>

        <section className="panel">
          <div className="job-detail-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span className="sidebar-avatar" style={{ background: 'var(--blue)', width: 46, height: 46, fontSize: 18 }}>TP</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Truxpylot Support</p>
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                Hi there 👋 — reach us any of the ways below and our Customer Service team will get back to you.
              </p>
            </div>
          </div>
        </section>

        <div className="detail-grid support-contact-grid">
          <a href="mailto:info@truxpylot.com" className="panel support-contact-card">
            <span className="support-contact-icon support-contact-icon--blue"><SupportIcon type="mail" /></span>
            <b>Email us</b>
            <span className="support-contact-value">info@truxpylot.com</span>
          </a>
          <a href="https://wa.me/2348054306905" target="_blank" rel="noreferrer" className="panel support-contact-card">
            <span className="support-contact-icon support-contact-icon--green"><SupportIcon type="chat" /></span>
            <b>WhatsApp us</b>
            <span className="support-contact-value">+234 805 430 6905</span>
          </a>
          <a href="tel:+2348054306905" className="panel support-contact-card">
            <span className="support-contact-icon support-contact-icon--blue"><SupportIcon type="phone" /></span>
            <b>Call us</b>
            <span className="support-contact-value">+234 805 430 6905</span>
          </a>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Common questions</h2></div>
          <div className="job-detail-body">
            <p><b>How do I request a professional?</b> Browse the <Link href="/marketplace">marketplace</Link>, open a verified profile, and use the Request Service button.</p>
            <p><b>Why haven&apos;t I heard back on my request?</b> Every request is reviewed by our Customer Service team before a professional is contacted — check its status from your dashboard.</p>
            <p><b>How do I get verified as a professional?</b> Submit your documents from Manage profile → Verification after registering.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
