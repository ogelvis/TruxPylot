'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobStatus } from '@prisma/client';

async function callAction(jobId: string, body: object) {
  const r = await fetch(`/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}

export function ProfessionalJobActions({ jobId, status }: { jobId: string; status: JobStatus }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(body: object) {
    setError('');
    setBusy(true);
    try {
      await callAction(jobId, body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'REQUESTED') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Respond to this request</h2></div>
        <div className="verification-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            Your quote (₦)
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 35000"
              style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }}
            />
          </label>
          <div className="verification-buttons">
            <button
              type="button"
              className="btn-approve"
              disabled={busy || !amount}
              onClick={() => run({ action: 'quote', amount: Math.round(Number(amount) * 100) })}
            >
              {busy ? 'Sending…' : 'Send quote'}
            </button>
            <button type="button" className="btn-reject" disabled={busy} onClick={() => run({ action: 'reject' })}>
              Decline job
            </button>
          </div>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  if (status === 'PAID') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Ready to begin</h2></div>
        <div className="job-detail-body">
          <p style={{ marginBottom: 14 }}>Payment has been confirmed. Let the customer know you're starting.</p>
          <button className="btn-approve" type="button" disabled={busy} onClick={() => run({ action: 'start' })}>
            {busy ? 'Updating…' : 'Mark as started'}
          </button>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  if (status === 'IN_PROGRESS') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Wrapping up</h2></div>
        <div className="job-detail-body">
          <p style={{ marginBottom: 14 }}>Once the work is done, mark it complete so the customer can confirm.</p>
          <button className="btn-approve" type="button" disabled={busy} onClick={() => run({ action: 'complete' })}>
            {busy ? 'Updating…' : 'Mark as complete'}
          </button>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  return null;
}
