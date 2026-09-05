import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main>
      <header className="site-nav">
        <Link href="/"><img src="/trux-pylot-logo.png" alt="Trux Pylot" /></Link>
        <nav>
          <a href="/marketplace">Find a professional</a>
          <a className="nav-cta" href="/register">Join as a professional</a>
        </nav>
      </header>

      <section className="landing" style={{ maxWidth: 780 }}>
        <p className="eyebrow">LEGAL</p>
        <h1 style={{ fontSize: 38 }}>Privacy Policy</h1>
        <p style={{ marginBottom: 30 }}>Last updated: {new Intl.DateTimeFormat('en-NG', { dateStyle: 'long' }).format(new Date())}</p>

        <section className="panel">
          <div className="job-detail-body" style={{ display: 'grid', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>1. Information we collect</h2>
              <p>When you register, we collect your name, email address, phone number, and location details you provide. If you register as a professional, we also collect your profession, experience, service categories, and — for verification — identity or trade documents you submit. If you register a business account, we collect your business name and registration (CAC) number. Payments are processed through Paystack; we do not store your card, bank, or payment credentials ourselves.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>2. How we use your information</h2>
              <p>We use your information to operate your account, connect customers with professionals, process payments, verify professional credentials, communicate with you about your requests, and improve the platform.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>3. Who can see your information</h2>
              <p>Your profile information visible on a public professional listing does not include your phone number, email address, or home address. Contact details are only shared internally with Truxpylot Customer Service to coordinate a request, and are shared with a matched professional only once Truxpylot has confirmed and connected both parties.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>4. Verification documents</h2>
              <p>Documents submitted for professional verification are stored privately and are only accessible to authorized Truxpylot reviewers for the purpose of confirming your identity and credentials.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>5. Data retention</h2>
              <p>We retain account information for as long as your account is active, and as needed to comply with legal and financial record-keeping obligations.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>6. Your choices</h2>
              <p>You can update your profile information, phone number, and location at any time from your dashboard. To request deletion of your account or data, contact us using the details below.</p>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontFamily: 'DM Sans', marginBottom: 6 }}>7. Contact us</h2>
              <p>Questions about this policy or your data can be sent to <a href="mailto:info@truxpylot.com">info@truxpylot.com</a>, or visit our <Link href="/support">support page</Link>.</p>
            </div>
          </div>
        </section>

        <p className="hint-text">This policy describes how Truxpylot's platform currently handles information based on its actual features. It is not a substitute for legal advice — consult a qualified professional to ensure full regulatory compliance for your jurisdiction.</p>
      </section>
    </main>
  );
}
