'use client';

export default function RegisterError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-main">
        <div className="auth-form-wrap">
          <p className="eyebrow">TRUX PYLOT REGISTRATION</p>
          <h1>Registration needs to be reloaded.</h1>
          <p>Your registration details are kept on this device while you complete the form. Reload the page and continue.</p>
          <button type="button" onClick={() => reset()}>Reload registration</button>
          <a className="secondary-action" href="/">Return home</a>
        </div>
      </section>
    </main>
  );
}
