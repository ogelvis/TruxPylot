'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VerificationSubmitForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!files.length) { setError('Attach at least one document.'); return; }
    setBusy(true);
    const body = new FormData();
    files.forEach(f => body.append('documents', f));
    try {
      const r = await fetch('/api/professional/verification', { method: 'POST', body });
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
    <form className="job-detail-body" onSubmit={submit}>
      <p style={{ marginBottom: 14 }}>
        Upload a valid ID and/or trade certificate so we can verify you. Verified professionals get a badge
        customers can trust and appear in search — this usually takes 1–2 business days to review.
      </p>
      <input
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        multiple
        onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
        style={{ marginBottom: 10 }}
      />
      {files.length > 0 && (
        <p className="hint-text" style={{ marginTop: 0, marginBottom: 14 }}>
          {files.length} file{files.length === 1 ? '' : 's'} selected: {files.map(f => f.name).join(', ')}
        </p>
      )}
      <button className="primary" type="submit" disabled={busy} style={{ width: 'auto' }}>
        {busy ? 'Submitting…' : 'Submit for verification'}
      </button>
      {error && <p className="form-status err">{error}</p>}
    </form>
  );
}
