'use client';
import { FormEvent, useState } from 'react';

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('busy');
    setError('');
    const email = new FormData(e.currentTarget).get('email');
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
        setStatus('idle');
        return setError(d.error || 'Something went wrong.');
      }
      setStatus('sent');
    } catch {
      setStatus('idle');
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="auth-form">
        <p className="eyebrow">CHECK YOUR EMAIL</p>
        <h1>Reset link sent</h1>
        <p>If an account exists with that email, a password reset link is on its way. It expires in 1 hour.</p>
        <p className="auth-switch"><a href="/login">← Back to sign in</a></p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="eyebrow">FORGOT PASSWORD</p>
      <h1>Reset your password</h1>
      <p>Enter the email on your account and we&apos;ll send you a reset link.</p>
      <input name="email" type="email" placeholder="Email address" required />
      <button type="submit" disabled={status === 'busy'}>{status === 'busy' ? 'Sending…' : 'Send reset link →'}</button>
      {error && <p role="alert">{error}</p>}
      <p className="auth-switch"><a href="/login">← Back to sign in</a></p>
    </form>
  );
}
