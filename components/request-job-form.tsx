'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Service = { categoryId: string; categoryName: string };

export function RequestJobForm({ professionalId, services }: { professionalId: string; services: Service[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(services[0]?.categoryId ?? '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredAt, setPreferredAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          categoryId,
          description,
          location,
          budget: budget ? Number(budget) : undefined,
          preferredAt: preferredAt || undefined,
        }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      router.push(`/dashboard/customer/jobs/${d.job.id}`);
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>
        Service needed
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
          {services.map(s => <option key={s.categoryId} value={s.categoryId}>{s.categoryName}</option>)}
        </select>
      </label>
      <label>
        Describe what you need
        <textarea value={description} onChange={e => setDescription(e.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder="e.g. Replace two faulty sockets in the kitchen and check the fuse box." />
      </label>
      <label>
        Location
        <input value={location} onChange={e => setLocation(e.target.value)} required minLength={3} placeholder="e.g. Trans Amadi, Port Harcourt" />
      </label>
      <label>
        Budget (₦, optional)
        <input type="number" min={1} value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 25000" />
      </label>
      <label>
        Preferred date (optional)
        <input type="date" value={preferredAt} onChange={e => setPreferredAt(e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Sending request…' : 'Send request →'}</button>
        {error && <p className="form-status err">{error}</p>}
      </div>
    </form>
  );
}
