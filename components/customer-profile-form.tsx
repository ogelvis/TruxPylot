'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

type Props = {
  fullName: string;
  phone: string;
  state: string;
  city: string;
  area: string;
  street: string;
};

export function CustomerProfileForm({ fullName, phone, state, city, area, street }: Props) {
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
      phone: String(f.get('phone') || '') || undefined,
      state: String(f.get('state') || '') || undefined,
      city: String(f.get('city') || '') || undefined,
      area: String(f.get('area') || '') || undefined,
      street: String(f.get('street') || '') || undefined,
    };
    try {
      const r = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({ error: 'Something went wrong.' }));
      if (!r.ok) {
        setStatus('error');
        setError(d.error || 'Something went wrong.');
        return;
      }
      setStatus('saved');
      router.refresh();
    } catch {
      setStatus('error');
      setError('Could not reach the server.');
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>Full name
        <input name="fullName" defaultValue={fullName} required minLength={2} />
      </label>
      <label>Phone number
        <input name="phone" defaultValue={phone} placeholder="+234…" />
      </label>
      <label>State
        <select name="state" defaultValue={state}>
          <option value="">Select state</option>
          {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>City
        <input name="city" defaultValue={city} placeholder="e.g. Port Harcourt" />
      </label>
      <label>Area / neighbourhood
        <input name="area" defaultValue={area} />
      </label>
      <label>Street / address
        <input name="street" defaultValue={street} />
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
