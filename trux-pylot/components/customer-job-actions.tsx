'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobStatus } from '@prisma/client';

async function patchJob(jobId: string, body: object) {
  const r = await fetch(`/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}

export function CustomerJobActions({
  jobId, status, latestQuoteId, latestQuoteAmount,
}: {
  jobId: string; status: JobStatus; latestQuoteId?: string; latestQuoteAmount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(body: object) {
    setError('');
    setBusy(true);
    try {
      await patchJob(jobId, body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  async function pay() {
    if (!latestQuoteId) return;
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, quoteId: latestQuoteId }),
      });
      const d = await r.json().catch(() => ({ error: 'Could not start payment.' }));
      if (!r.ok) throw new Error(d.error || 'Could not start payment.');
      window.location.href = d.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.');
      setBusy(false);
    }
  }

  if (status === 'QUOTED' && latestQuoteAmount) {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Quote received</h2></div>
        <div className="job-detail-body">
          <p style={{ fontSize: 22, fontFamily: 'Manrope', fontWeight: 800, marginBottom: 14 }}>₦{latestQuoteAmount.toLocaleString()}</p>
          <div className="verification-buttons">
            <button className="btn-approve" type="button" disabled={busy} onClick={() => run({ action: 'accept' })}>
              {busy ? 'Working…' : 'Accept quote'}
            </button>
            <button className="btn-reject" type="button" disabled={busy} onClick={() => run({ action: 'cancel' })}>
              Cancel request
            </button>
          </div>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  if (status === 'REQUESTED') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Waiting on the professional</h2></div>
        <div className="job-detail-body">
          <p style={{ marginBottom: 14 }}>You&apos;ll be notified as soon as they respond with a quote.</p>
          <button className="btn-reject" type="button" disabled={busy} onClick={() => run({ action: 'cancel' })}>
            Cancel request
          </button>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  if (status === 'ACCEPTED') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Ready for payment</h2></div>
        <div className="job-detail-body">
          <p style={{ marginBottom: 14 }}>Pay securely through Paystack to activate this job.</p>
          <button className="primary" type="button" disabled={busy || !latestQuoteId} onClick={pay}>
            {busy ? 'Redirecting…' : 'Pay now →'}
          </button>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <section className="panel">
        <div className="panel-head"><h2>Confirm completion</h2></div>
        <div className="job-detail-body">
          <p style={{ marginBottom: 14 }}>The professional has marked this job as complete. Confirm to release payment.</p>
          <button className="btn-approve" type="button" disabled={busy} onClick={() => run({ action: 'confirm' })}>
            {busy ? 'Confirming…' : 'Confirm & release payment'}
          </button>
          {error && <p className="form-status err">{error}</p>}
        </div>
      </section>
    );
  }

  return null;
}
