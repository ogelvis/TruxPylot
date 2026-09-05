'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReviewForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, rating, review: review || undefined }),
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

  return (
    <section className="panel">
      <div className="panel-head"><h2>Leave a review</h2></div>
      <form className="job-detail-body" onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              style={{ background: 'none', border: 0, fontSize: 22, cursor: 'pointer', color: n <= rating ? '#ed991e' : '#d9e1ef', width: 'auto', padding: '0 2px' }}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >★</button>
          ))}
        </div>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="How did it go? (optional)"
          style={{ width: '100%', border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit', marginBottom: 12 }}
        />
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button>
        {error && <p className="form-status err">{error}</p>}
      </form>
    </section>
  );
}
