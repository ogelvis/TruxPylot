'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function JobPostingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage('');
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/job-postings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.get('title'), location: f.get('location'), description: f.get('description'), category: f.get('category') || undefined, budget: f.get('budget') || undefined, deadline: f.get('deadline') || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMessage(d.error || 'Could not post the job.'); return; }
      e.currentTarget.reset(); setMessage('Job posted successfully. Professionals can now express interest.'); router.refresh();
    } catch { setMessage('Could not reach the server. Please try again.'); } finally { setBusy(false); }
  }
  return <form className="job-post-form" onSubmit={submit}>
    <div className="job-form-grid"><label>Job title<input name="title" placeholder="e.g. Need an electrician for a project" required /></label><label>Location<input name="location" placeholder="City / State" required /></label><label>Category<input name="category" placeholder="Optional service or skill" /></label><label>Budget (₦)<input name="budget" type="number" min="0" placeholder="Optional" /></label></div>
    <label>What do you need?<textarea name="description" rows={4} maxLength={5000} placeholder="Briefly describe the work, requirements or project." required /></label>
    <label>Application deadline <input name="deadline" type="date" /></label>
    <div className="form-actions"><button type="submit" disabled={busy}>{busy ? 'Posting…' : 'Post job'}</button>{message && <span className="form-status">{message}</span>}</div>
  </form>;
}
