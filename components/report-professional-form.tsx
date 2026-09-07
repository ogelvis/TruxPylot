'use client';
import { useState } from 'react';

export function ReportProfessionalForm({ professionalId }: { professionalId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/professional-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId, reason, description }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      setSent(true);
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (sent) {
    return <p className="hint-text">Thanks — your report has been sent to Truxpylot for review.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="back-link" style={{ marginBottom: 0 }} onClick={() => setOpen(true)}>
        ⚑ Report this professional
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
        Reason
        <input value={reason} onChange={e => setReason(e.target.value)} required minLength={3} maxLength={120} placeholder="e.g. Unprofessional conduct, misleading profile" style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }} />
      </label>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
        Details
        <textarea value={description} onChange={e => setDescription(e.target.value)} required minLength={10} maxLength={2000} rows={3} style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }} />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn-reject" style={{ width: 'auto' }} disabled={submitting}>{submitting ? 'Sending…' : 'Submit report'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ width: 'auto', background: 'none', border: 0, color: 'var(--muted)', fontWeight: 700 }}>Cancel</button>
      </div>
      {error && <p className="form-status err">{error}</p>}
    </form>
  );
}
