'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ServiceRequestCancelButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function cancel() {
    if (!confirm('Cancel this service request?')) return;
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/service-requests/' + requestId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      if (!r.ok) throw new Error(d.error || 'Something went wrong.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-reject" style={{ width: 'auto' }} disabled={busy} onClick={cancel}>
        {busy ? 'Cancelling…' : 'Cancel request'}
      </button>
      {error && <p className="form-status err">{error}</p>}
    </>
  );
}
