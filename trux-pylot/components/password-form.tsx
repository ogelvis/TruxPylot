'use client';
import { FormEvent, useState } from 'react';

export function PasswordForm() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('saving');
    setError('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: f.get('currentPassword'),
        newPassword: f.get('newPassword'),
      }),
    });
    const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
    if (!r.ok) {
      setStatus('error');
      setError(d.error || 'Something went wrong.');
      return;
    }
    setStatus('saved');
    e.currentTarget.reset();
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>Current password
        <input name="currentPassword" type="password" required />
      </label>
      <label>New password
        <input name="newPassword" type="password" minLength={12} required placeholder="12+ characters" />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Updating…' : 'Update password'}</button>
        {status === 'saved' && <span className="form-status ok">Password updated ✓</span>}
        {status === 'error' && <span className="form-status err">{error}</span>}
      </div>
    </form>
  );
}
