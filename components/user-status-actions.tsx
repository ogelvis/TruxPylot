'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserStatusActions({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7d');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function act(action: 'SUSPEND' | 'BLOCK' | 'REACTIVATE') {
    if (action !== 'REACTIVATE' && !reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setBusy(action);
    setError('');
    const r = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason || undefined, duration: action === 'SUSPEND' ? duration : undefined }),
    });
    const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
    setBusy(null);
    if (!r.ok) {
      setError(d.error || 'Something went wrong.');
      return;
    }
    router.refresh();
  }

  if (currentStatus !== 'ACTIVE') {
    return (
      <div className="verification-actions">
        <button className="btn-approve" disabled={!!busy} onClick={() => act('REACTIVATE')}>
          {busy === 'REACTIVATE' ? 'Reactivating…' : 'Reactivate account'}
        </button>
        {error && <p className="form-status err">{error}</p>}
      </div>
    );
  }

  return (
    <div className="verification-actions">
      <textarea placeholder="Reason (required)" value={reason} onChange={e => setReason(e.target.value)} rows={2} />
      <select value={duration} onChange={e => setDuration(e.target.value)}>
        <option value="24h">Suspend 24 hours</option>
        <option value="7d">Suspend 7 days</option>
        <option value="30d">Suspend 30 days</option>
        <option value="indefinite">Suspend indefinitely</option>
      </select>
      <div className="verification-buttons">
        <button className="btn-info" disabled={!!busy} onClick={() => act('SUSPEND')}>
          {busy === 'SUSPEND' ? 'Suspending…' : 'Suspend'}
        </button>
        <button className="btn-reject" disabled={!!busy} onClick={() => act('BLOCK')}>
          {busy === 'BLOCK' ? 'Blocking…' : 'Block permanently'}
        </button>
      </div>
      {error && <p className="form-status err">{error}</p>}
    </div>
  );
}
