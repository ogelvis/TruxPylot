'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VerificationActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function act(action: 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFORMATION') {
    setBusy(action);
    setError('');
    const r = await fetch(`/api/admin/verifications/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes: notes || undefined }),
    });
    const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
    setBusy(null);
    if (!r.ok) {
      setError(d.error || 'Something went wrong.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="verification-actions">
      <textarea
        placeholder="Optional notes (required if rejecting or requesting more information)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />
      <div className="verification-buttons">
        <button className="btn-approve" disabled={!!busy} onClick={() => act('APPROVE')}>
          {busy === 'APPROVE' ? 'Approving…' : 'Approve'}
        </button>
        <button className="btn-info" disabled={!!busy} onClick={() => act('REQUEST_MORE_INFORMATION')}>
          {busy === 'REQUEST_MORE_INFORMATION' ? 'Sending…' : 'Request more info'}
        </button>
        <button className="btn-reject" disabled={!!busy} onClick={() => act('REJECT')}>
          {busy === 'REJECT' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <p className="form-status err">{error}</p>}
    </div>
  );
}
