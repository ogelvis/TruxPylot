import Link from 'next/link';

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

      <section className="landing" style={{ maxWidth: 720 }}>
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

        <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <a href="mailto:info@truxpylot.com" className="panel" style={{ padding: 22, display: 'block', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>✉️</div>
            <b style={{ display: 'block', marginBottom: 4 }}>Email us</b>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>info@truxpylot.com</span>
          </a>
          <a href="https://wa.me/2348054306905" target="_blank" rel="noreferrer" className="panel" style={{ padding: 22, display: 'block', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>💬</div>
            <b style={{ display: 'block', marginBottom: 4 }}>WhatsApp us</b>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>+234 805 430 6905</span>
          </a>
          <a href="tel:+2348054306905" className="panel" style={{ padding: 22, display: 'block', textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>📞</div>
            <b style={{ display: 'block', marginBottom: 4 }}>Call us</b>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>+234 805 430 6905</span>
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
