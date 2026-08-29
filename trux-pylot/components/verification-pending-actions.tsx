'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VerificationPendingActions({ email }: { email: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [status, setStatus] = useState<'idle' | 'busy'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function resend() {
    setStatus('busy'); setError(''); setMessage('');
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      setStatus('idle');
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      setMessage(d.emailSent ? 'Verification email sent.' : 'Email sending is not configured yet — contact support.');
    } catch {
      setStatus('idle');
      setError('Could not reach the server.');
    }
  }

  async function changeEmail() {
    if (!newEmail.trim()) return setError('Enter a new email address.');
    setStatus('busy'); setError(''); setMessage('');
    try {
      const r = await fetch('/api/auth/change-pending-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      setStatus('idle');
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      setMessage(`Email updated to ${d.email}. Check your inbox for a new link.`);
      setEditingEmail(false);
      router.refresh();
    } catch {
      setStatus('idle');
      setError('Could not reach the server.');
    }
  }

  return (
    <div className="verify-pending-actions">
      <a className="primary" href={`mailto:${email}`}>Open email →</a>
      <button type="button" className="secondary" disabled={status === 'busy'} onClick={resend}>
        {status === 'busy' ? 'Sending…' : 'Resend verification'}
      </button>
      <button type="button" className="secondary" onClick={() => setEditingEmail(v => !v)}>
        Change email
      </button>

      {editingEmail && (
        <div className="change-email-row">
          <input type="email" placeholder="New email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <button type="button" onClick={changeEmail} disabled={status === 'busy'}>Update</button>
        </div>
      )}

      {message && <p className="form-status ok">{message}</p>}
      {error && <p className="form-status err">{error}</p>}
    </div>
  );
}
