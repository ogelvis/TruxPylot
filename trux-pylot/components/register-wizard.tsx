'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

type Role = 'CUSTOMER' | 'PROFESSIONAL';

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak', level: 1 };
  if (score <= 3) return { label: 'Fair', level: 2 };
  return { label: 'Strong', level: 3 };
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 320;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.75);
}

export function RegisterWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [profession, setProfession] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const steps = role === 'PROFESSIONAL'
    ? ['Role', 'Personal info', 'Location', 'Professional info', 'Security']
    : ['Role', 'Personal info', 'Location', 'Security'];
  const lastStep = steps.length - 1;
  const strength = scorePassword(password);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setAvatarUrl(dataUrl);
    } catch {
      setAvatarError('Could not process that image. Try a different photo.');
    }
  }

  function next() {
    setError('');
    if (step === 0 && !role) return setError('Choose an option to continue.');
    if (step === 1 && (!fullName.trim() || !email.trim())) return setError('Full name and email are required.');
    setStep(s => Math.min(lastStep, s + 1));
  }
  function back() {
    setError('');
    setStep(s => Math.max(0, s - 1));
  }

  async function submit() {
    setError('');
    if (password.length < 12) return setError('Password must be at least 12 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    const body = {
      role, fullName, email, phone: phone || undefined,
      country: country || undefined, state: state || undefined, city: city || undefined,
      area: area || undefined, street: street || undefined,
      profession: role === 'PROFESSIONAL' ? profession || undefined : undefined,
      yearsExperience: role === 'PROFESSIONAL' && yearsExperience ? Number(yearsExperience) : undefined,
      avatarUrl: avatarUrl || undefined,
      password,
    };
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      if (!r.ok) {
        setSubmitting(false);
        return setError(d.error || 'Something went wrong.');
      }
      router.push(d.redirect || '/login');
      router.refresh();
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  return (
    <div className="auth-form register-wizard">
      <p className="eyebrow">JOIN TRUX PYLOT</p>
      <h1>Create your account</h1>
      <p>Find work or trusted help. It only takes a minute to begin.</p>

      <div className="wizard-progress">
        {steps.map((label, i) => (
          <div key={label} className={`wizard-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <span>{i < step ? '✓' : i + 1}</span>{label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="role-picker">
          <p className="wizard-question">What are you here to do?</p>
          <button type="button" className={`role-card ${role === 'CUSTOMER' ? 'selected' : ''}`} onClick={() => setRole('CUSTOMER')}>
            <b>I need a professional</b>
            <span>Find and book trusted help for a job.</span>
          </button>
          <button type="button" className={`role-card ${role === 'PROFESSIONAL' ? 'selected' : ''}`} onClick={() => setRole('PROFESSIONAL')}>
            <b>I want to offer my services</b>
            <span>Get verified and start receiving job requests.</span>
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-fields">
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" required />
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" required />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp phone number" />
        </div>
      )}

      {step === 2 && (
        <div className="wizard-fields">
          <select value={country} onChange={e => setCountry(e.target.value)}>
            <option>Nigeria</option>
            <option>Ghana</option>
            <option>Other</option>
          </select>
          <select value={state} onChange={e => setState(e.target.value)}>
            <option value="">Select state</option>
            {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
          <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area / neighbourhood" />
          <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Street / address" />
        </div>
      )}

      {step === 3 && role === 'PROFESSIONAL' && (
        <div className="wizard-fields">
          <input value={profession} onChange={e => setProfession(e.target.value)} placeholder="What service do you provide? e.g. Electrician" />
          <input value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} type="number" min={0} max={60} placeholder="Years of experience" />
          <p className="hint-text">You can add specific skills, a bio and portfolio from your dashboard after signing up.</p>
        </div>
      )}

      {step === lastStep && (
        <div className="wizard-fields">
          <div className="avatar-upload">
            <div className="avatar-preview">
              {avatarUrl ? <img src={avatarUrl} alt="Profile preview" /> : <span>{fullName ? fullName[0].toUpperCase() : '?'}</span>}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}>Upload profile picture</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} hidden />
              {avatarError && <p className="form-status err">{avatarError}</p>}
            </div>
          </div>

          <div className="password-field">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (12+ characters)"
              required
            />
            <button type="button" className="eye-toggle" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password visibility">
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {password && (
            <div className={`strength-meter level-${strength.level}`}>
              <div className="strength-bar"><span /><span /><span /></div>
              <small>{strength.label}</small>
            </div>
          )}
          <input
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            required
          />
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      <div className="wizard-actions">
        {step > 0 && <button type="button" className="wizard-back" onClick={back}>← Back</button>}
        {step < lastStep
          ? <button type="button" onClick={next}>Continue →</button>
          : <button type="button" onClick={submit} disabled={submitting}>{submitting ? 'Creating account…' : 'Create account →'}</button>}
      </div>

      <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
    </div>
  );
}
