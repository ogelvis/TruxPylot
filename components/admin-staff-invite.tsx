'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export function AdminStaffInvite() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'OPERATOR'>('EDITOR');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          fullName,
          role,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Could not send invitation.');
        return;
      }

      setMessage(`Invitation sent to ${email}.`);
      setEmail('');
      setFullName('');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dash-page">
      <div className="page-heading">
        <div>
          <p className="page-kicker">ACCESS CONTROL</p>
          <h1>Staff access</h1>
          <p className="subcopy">
            Invite restricted operational staff without exposing Super Admin
            controls or infrastructure secrets.
          </p>
        </div>
      </div>

      <section className="form-card" style={{ maxWidth: 620 }}>
        <h2>Invite an operator or editor</h2>

        <form onSubmit={submit} className="auth-form">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Work email"
            required
          />

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'EDITOR' | 'OPERATOR')
            }
          >
            <option value="EDITOR">Editor</option>
            <option value="OPERATOR">Operator</option>
          </select>

          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send secure invitation →'}
          </button>
        </form>

        {message && (
          <p role="status" style={{ color: '#168553', fontWeight: 700 }}>
            {message}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: '#b42318', fontWeight: 700 }}>
            {error}
          </p>
        )}

        <p className="subcopy">
          Staff accounts can only use the restricted operations workspace.
          They cannot create Super Admins, access database credentials,
          environment variables, payment secrets, hosting controls, backups
          or critical security settings.
        </p>
      </section>
    </main>
  );
}
