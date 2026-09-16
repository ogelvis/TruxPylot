'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProposalForm({ jobId, budget }: { jobId: string; budget: number | null }) {
  const router = useRouter();
  const [amount, setAmount] = useState(budget ? String(budget) : '');
  const [priceType, setPriceType] = useState('FIXED');
  const [duration, setDuration] = useState('');
  const [availableAt, setAvailableAt] = useState('');
  const [message, setMessage] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'proposal', amount: Number(amount), priceType, estimatedDuration: duration || undefined, availableAt: availableAt || undefined, message: message || undefined, workDescription: workDescription || undefined }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setError(data.error || 'Could not submit proposal.');
    router.refresh();
  }

  return <form className="profile-form proposal-form" onSubmit={submit}>
    <label>Estimated price (₦)<input type="number" min={1} required value={amount} onChange={event => setAmount(event.target.value)} /></label>
    <label>Price type<select value={priceType} onChange={event => setPriceType(event.target.value)}><option value="FIXED">Fixed price</option><option value="RANGE">Estimated range</option><option value="HOURLY">Hourly rate</option></select></label>
    <label>Estimated duration<input value={duration} onChange={event => setDuration(event.target.value)} placeholder="e.g. 2–3 hours" /></label>
    <label>Available date and time<input type="datetime-local" value={availableAt} onChange={event => setAvailableAt(event.target.value)} /></label>
    <label>Short message<textarea required minLength={10} maxLength={1000} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Explain why you are a good fit." /></label>
    <label>Work description<textarea maxLength={2000} rows={3} value={workDescription} onChange={event => setWorkDescription(event.target.value)} placeholder="What will the customer receive?" /></label>
    {error && <p className="form-status err">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? 'Sending proposal…' : 'Send proposal →'}</button>
  </form>;
}
