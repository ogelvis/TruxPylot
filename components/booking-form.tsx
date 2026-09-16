'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BookingForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const response = await fetch(`/api/jobs/${jobId}/booking`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startAt, endAt }) });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setError(data.error || 'Could not confirm this time slot.');
    router.refresh();
  }

  return <form className="profile-form booking-form" onSubmit={submit}>
    <label>Start date and time<input type="datetime-local" required value={startAt} onChange={event => setStartAt(event.target.value)} /></label>
    <label>End date and time<input type="datetime-local" required value={endAt} onChange={event => setEndAt(event.target.value)} /></label>
    {error && <p className="form-status err">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? 'Checking availability…' : 'Confirm time slot'}</button>
  </form>;
}
