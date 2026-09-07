'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceRequestStatus } from '@prisma/client';

const NEXT_ACTION: Partial<Record<ServiceRequestStatus, { action: string; label: string }>> = {
  SUBMITTED: { action: 'MARK_REVIEWING', label: 'Start reviewing' },
  CSD_REVIEWING: { action: 'CONFIRM_AVAILABILITY', label: 'Mark availability confirmed' },
  AVAILABILITY_CONFIRMATION: { action: 'CONFIRM_PROFESSIONAL', label: 'Mark professional confirmed' },
  PROFESSIONAL_CONFIRMED: { action: 'MARK_CONNECTED', label: 'Mark connected' },
  CONNECTED: { action: 'MARK_COMPLETED', label: 'Mark completed' },
};

const DECLINABLE = new Set(['SUBMITTED', 'CSD_REVIEWING', 'AVAILABILITY_CONFIRMATION', 'PROFESSIONAL_CONFIRMED']);

export function CsdActions({ requestId, status }: { requestId: string; status: ServiceRequestStatus }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showDecline, setShowDecline] = useState(false);

  async function run(action: string, requireNotes: boolean) {
    if (requireNotes && !notes.trim()) {
      setError('Add a reason before declining.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/service-requests/' + requestId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      if (!r.ok) throw new Error(d.error || 'Something went wrong.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const next = NEXT_ACTION[status];

  return (
    <div className="verification-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
        CSD notes {showDecline && '(required to decline)'}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Internal notes — availability confirmed by phone, reason for decline, etc."
          style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }}
        />
      </label>
      <div className="verification-buttons">
        {next && (
          <button type="button" className="btn-approve" disabled={busy} onClick={() => run(next.action, false)}>
            {busy ? 'Updating…' : next.label}
          </button>
        )}
        {DECLINABLE.has(status) && (
          showDecline ? (
            <button type="button" className="btn-reject" disabled={busy} onClick={() => run('DECLINE', true)}>
              {busy ? 'Declining…' : 'Confirm decline'}
            </button>
          ) : (
            <button type="button" className="btn-info" disabled={busy} onClick={() => setShowDecline(true)}>
              Decline request
            </button>
          )
        )}
      </div>
      {error && <p className="form-status err">{error}</p>}
    </div>
  );
}
