'use client';
import { useState } from 'react';
import Link from 'next/link';

type Service = { categoryId: string; categoryName: string };

export function RequestServiceForm({ professionalId, services }: { professionalId: string; services: Service[] }) {
  const [categoryId, setCategoryId] = useState(services[0]?.categoryId ?? '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [additional, setAdditional] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          categoryId,
          description,
          location,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
          additionalRequirements: additional || undefined,
        }),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      setReference(d.serviceRequest.id.slice(-8).toUpperCase());
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (reference) {
    return (
      <div className="job-detail-body">
        <p className="form-status ok" style={{ marginBottom: 10 }}>Request submitted.</p>
        <p style={{ marginBottom: 14 }}>
          Your reference number is <b>REQ-{reference}</b>. Our Customer Service team will review your request,
          confirm the professional&apos;s availability, and connect you both — you&apos;ll see progress in your dashboard.
        </p>
        <Link className="primary" href="/dashboard/customer/service-requests" style={{ display: 'inline-block', width: 'auto' }}>
          Track my requests →
        </Link>
      </div>
    );
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
        Describe the job
        <textarea value={description} onChange={e => setDescription(e.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder="What do you need done?" />
      </label>
      <label>
        Location
        <input value={location} onChange={e => setLocation(e.target.value)} required minLength={3} placeholder="e.g. Trans Amadi, Port Harcourt" />
      </label>
      <label>
        Preferred date
        <input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
      </label>
      <label>
        Preferred time
        <input value={preferredTime} onChange={e => setPreferredTime(e.target.value)} placeholder="e.g. Morning, or 2:00 PM" />
      </label>
      <label>
        Additional requirements (optional)
        <textarea value={additional} onChange={e => setAdditional(e.target.value)} maxLength={1000} rows={2} placeholder="Anything else Truxpylot Customer Service should know" />
      </label>
      <p className="hint-text">
        Your request goes to Truxpylot Customer Service first — they&apos;ll confirm the professional&apos;s
        availability and connect you both. Your contact details are not shared until that&apos;s confirmed.
      </p>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Sending request…' : 'Submit request →'}</button>
        {error && <p className="form-status err">{error}</p>}
      </div>
    </form>
  );
}
