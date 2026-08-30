'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  fullName: string;
  profession: string;
  bio: string;
  location: string;
  yearsExperience: number | '';
  phone: string;
  verificationStatus: string;
};

export function ProfileForm({ fullName, profession, bio, location, yearsExperience, phone, verificationStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('saving');
    setError('');
    const f = new FormData(e.currentTarget);
    const body = {
      fullName: String(f.get('fullName') || ''),
      profession: String(f.get('profession') || ''),
      bio: String(f.get('bio') || ''),
      location: String(f.get('location') || ''),
      phone: String(f.get('phone') || '') || undefined,
      yearsExperience: f.get('yearsExperience') ? Number(f.get('yearsExperience')) : undefined,
    };
    const r = await fetch('/api/professional/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({ error: 'Something went wrong. Please try again.' }));
    if (!r.ok) {
      setStatus('error');
      setError(d.error || 'Something went wrong.');
      return;
    }
    setStatus('saved');
    router.refresh();
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="verification-banner">
        <span>Verification status</span>
        <b className={`status ${verificationStatus.toLowerCase()}`}>{verificationStatus.replaceAll('_', ' ')}</b>
      </div>

      <label>Full name
        <input name="fullName" defaultValue={fullName} required minLength={2} />
      </label>
      <label>Profession
        <input name="profession" defaultValue={profession} placeholder="e.g. Electrician" />
      </label>
      <label>Phone number
        <input name="phone" defaultValue={phone} placeholder="+234…" />
      </label>
      <label>Location
        <input name="location" defaultValue={location} placeholder="e.g. Port Harcourt" />
      </label>
      <label>Years of experience
        <input name="yearsExperience" type="number" min={0} max={60} defaultValue={yearsExperience} />
      </label>
      <label>Biography
        <textarea name="bio" defaultValue={bio} rows={5} placeholder="Tell customers about your experience and specialties." />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && <span className="form-status ok">Saved ✓</span>}
        {status === 'error' && <span className="form-status err">{error}</span>}
      </div>
    </form>
  );
}
