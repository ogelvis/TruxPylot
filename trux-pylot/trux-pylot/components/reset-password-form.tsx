'use client';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return setError('This reset link is missing its token. Request a new one.');
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') || '');
    const confirm = String(f.get('confirm') || '');
    if (password.length < 12) return setError('Password must be at least 12 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setStatus('busy');
    setError('');
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      if (!r.ok) {
        setStatus('idle');
        return setError(d.error || 'Something went wrong.');
      }
      setStatus('done');
      setTimeout(() => { router.push('/login'); router.refresh(); }, 1800);
    } catch {
      setStatus('idle');
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (!token) {
    return (
      <div className="auth-form">
        <p className="eyebrow">RESET PASSWORD</p>
        <h1>Link incomplete</h1>
        <p>This reset link is missing its token. Request a new one from the sign-in page.</p>
        <p className="auth-switch"><a href="/forgot-password">Request a new link</a></p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="auth-form">
        <p className="eyebrow">DONE</p>
        <h1>Password updated</h1>
        <p>Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="eyebrow">RESET PASSWORD</p>
      <h1>Choose a new password</h1>
      <p>Must be at least 12 characters.</p>
      <input name="password" type="password" placeholder="New password" required minLength={12} />
      <input name="confirm" type="password" placeholder="Confirm new password" required minLength={12} />
      <button type="submit" disabled={status === 'busy'}>{status === 'busy' ? 'Updating…' : 'Update password →'}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
