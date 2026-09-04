'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Action = 'MARK_UNDER_REVIEW' | 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFORMATION';

const BUSY_LABEL: Record<Action, string> = {
  MARK_UNDER_REVIEW: 'Updating…',
  APPROVE: 'Approving…',
  REJECT: 'Rejecting…',
  REQUEST_MORE_INFORMATION: 'Sending…',
};

export function VerificationActions({ requestId, status }: { requestId: string; status: 'SUBMITTED' | 'UNDER_REVIEW' }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState('');

  async function act(action: Action) {
    if ((action === 'REJECT' || action === 'REQUEST_MORE_INFORMATION') && !notes.trim()) {
      setError(action === 'REJECT'
        ? 'Please explain why this request is being rejected.'
        : 'Please explain what the professional still needs to submit or correct.');
      return;
    }
    if (action === 'REJECT' && !window.confirm("Reject this professional's verification? They will need to resubmit their documents.")) {
      return;
    }

    setBusy(action);
    setError('');
    let res: Response;
    try {
      res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
    } catch {
      setBusy(null);
      setError('Network error — please try again.');
      return;
    }
    const data = await res.json().catch(() => ({ error: 'Something went wrong.' }));
    setBusy(null);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="verification-actions">
      <textarea
        placeholder="Notes (required to reject or request more information)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
      />
      <div className="verification-buttons">
        {status === 'SUBMITTED' && (
          <button className="btn-info" disabled={!!busy} onClick={() => act('MARK_UNDER_REVIEW')}>
            {busy === 'MARK_UNDER_REVIEW' ? BUSY_LABEL.MARK_UNDER_REVIEW : 'Mark under review'}
          </button>
        )}
        <button className="btn-approve" disabled={!!busy} onClick={() => act('APPROVE')}>
          {busy === 'APPROVE' ? BUSY_LABEL.APPROVE : 'Approve'}
        </button>
        <button className="btn-info" disabled={!!busy} onClick={() => act('REQUEST_MORE_INFORMATION')}>
          {busy === 'REQUEST_MORE_INFORMATION' ? BUSY_LABEL.REQUEST_MORE_INFORMATION : 'Request more info'}
        </button>
        <button className="btn-reject" disabled={!!busy} onClick={() => act('REJECT')}>
          {busy === 'REJECT' ? BUSY_LABEL.REJECT : 'Reject'}
        </button>
      </div>
      {error && <p className="form-status err">{error}</p>}
    </div>
  );
}
