'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PortfolioModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(action: 'APPROVE' | 'REJECT') {
    if (busy) return;
    if (action === 'REJECT' && !confirm('Reject and remove this post? The professional can re-upload a corrected version.')) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/admin/portfolio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        setError(d?.error || 'Could not complete this action.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="verification-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
      <button type="button" className="btn-approve" disabled={busy} onClick={() => act('APPROVE')}>Approve</button>
      <button type="button" className="btn-reject" disabled={busy} onClick={() => act('REJECT')}>Reject</button>
      {error && <p role="alert" className="portfolio-composer-error">{error}</p>}
    </div>
  );
}
