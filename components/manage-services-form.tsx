'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = { id: string; name: string };
type Service = { id: string; startingPrice: number | null; category: { id: string; name: string } };

export function ManageServicesForm({ availableCategories, currentServices }: { availableCategories: Category[]; currentServices: Service[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(availableCategories[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remainingCategories = availableCategories.filter(c => !currentServices.some(s => s.category.id === c.id));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/professional/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, startingPrice: price ? Math.round(Number(price) * 100) : undefined }),
      });
      const d = await r.json().catch(() => ({ error: 'Could not add service.' }));
      if (!r.ok) throw new Error(d.error || 'Could not add service.');
      setPrice('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add service.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/professional/services/' + id, { method: 'DELETE' });
      const d = await r.json().catch(() => ({ error: 'Could not remove service.' }));
      if (!r.ok) throw new Error(d.error || 'Could not remove service.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove service.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Services you offer</h2></div>
      <div className="job-detail-body">
        {currentServices.length ? currentServices.map(s => (
          <div className="table-row" key={s.id} style={{ gridTemplateColumns: '1fr auto' }}>
            <div className="job-name">
              <b>{s.category.name}</b>
              {s.startingPrice != null && <span>From ₦{(s.startingPrice / 100).toLocaleString()}</span>}
            </div>
            <button type="button" className="btn-reject" disabled={busy} onClick={() => remove(s.id)}>Remove</button>
          </div>
        )) : <p className="subcopy" style={{ marginBottom: 14 }}>You have not added any services yet — add one below so customers can find and request you.</p>}

        {remainingCategories.length > 0 ? (
          <form onSubmit={add} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: currentServices.length ? 18 : 0 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              Service
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }}>
                {remainingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              Starting price (₦, optional)
              <input type="number" min={1} value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 15000" style={{ border: '1px solid #d9e1ef', borderRadius: 8, padding: '11px 12px', font: 'inherit' }} />
            </label>
            <button className="btn-approve" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add service'}</button>
          </form>
        ) : availableCategories.length > 0 && (
          <p className="hint-text">You already offer every available service category.</p>
        )}
        {error && <p className="form-status err">{error}</p>}
      </div>
    </section>
  );
}
