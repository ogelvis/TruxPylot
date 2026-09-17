'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProposalActions({ jobId, quoteId }: { jobId: string; quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(action: 'accept_proposal' | 'decline_proposal') {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, quoteId }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(data.error || 'Could not update proposal.');
    router.refresh();
  }
  return <div className="proposal-actions"><button className="primary" disabled={busy} onClick={() => act('accept_proposal')}>Accept proposal</button><button className="secondary-action" disabled={busy} onClick={() => act('decline_proposal')}>Decline</button>{error && <p className="form-status err">{error}</p>}</div>;
}
