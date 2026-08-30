'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function sendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', email }),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong');
      setSent(true);
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong');
      router.push(d.redirect || '/dashboard');
      router.refresh();
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (sent) {
    return (
      <form className="auth-form" onSubmit={verifyCode}>
        <p className="eyebrow">CHECK YOUR EMAIL</p>
        <h1>Enter your code</h1>
        <p>We sent a 6-digit code to <b>{email}</b>.</p>
        <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" placeholder="6-digit code" required />
        <button type="submit" disabled={submitting}>{submitting ? 'Verifying…' : 'Verify & sign in →'}</button>
        {error && <p role="alert">{error}</p>}
        <p className="auth-switch"><button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }}>Use a different email</button></p>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={sendCode}>
      <p className="eyebrow">WELCOME BACK</p>
      <h1>Sign in to your account</h1>
      <p>Manage jobs, messages and payments in one secure place.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" required />
      <button type="submit" disabled={submitting}>{submitting ? 'Sending code…' : 'Send sign-in code →'}</button>
      {error && <p role="alert">{error}</p>}
      <p className="auth-switch">New to Trux Pylot? <a href="/register">Create an account</a></p>
    </form>
  );
}
