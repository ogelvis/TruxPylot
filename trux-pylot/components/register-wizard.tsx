'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

type Role = 'CUSTOMER' | 'PROFESSIONAL';

export function RegisterWizard() {
  const router = useRouter();
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const steps = role === 'PROFESSIONAL'
    ? ['Role', 'Personal info', 'Location', 'Professional info', 'Verify email']
    : ['Role', 'Personal info', 'Location', 'Verify email'];
  const lastStep = steps.length - 1;

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

  async function sendCode() {
    if (resendCooldown > 0) return;
    setError('');
    setSubmitting(true);
    const body = {
      mode: 'register', role, fullName, email, phone: phone || undefined,
      country: country || undefined, state: state || undefined, city: city || undefined,
      area: area || undefined, street: street || undefined,
      profession: role === 'PROFESSIONAL' ? profession || undefined : undefined,
      yearsExperience: role === 'PROFESSIONAL' && yearsExperience ? Number(yearsExperience) : undefined,
    };
    try {
      const r = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong.');
      setOtpSent(true);
      setCode('');
      setResendCooldown(60);
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  async function verifyCode() {
    setError('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      setSubmitting(false);
      if (!r.ok) {
        // A 409 means Supabase already accepted this code (it's now
        // burned — one-time use) but creating the account failed for an
        // unrelated reason (e.g. duplicate phone number). Re-entering the
        // same code again would just fail again, so send the user back to
        // request a fresh one after they fix the conflicting field.
        if (r.status === 409) {
          setOtpSent(false);
          setCode('');
        }
        return setError(d.error || 'Something went wrong.');
      }
      router.push(d.redirect || '/dashboard');
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
          <p className="hint-text">You can add specific skills, a bio, a profile photo and portfolio from your dashboard after signing up.</p>
        </div>
      )}

      {step === lastStep && (
        <div className="wizard-fields">
          {!otpSent ? (
            <p className="hint-text">We&apos;ll email a 6-digit code to <b>{email}</b> to confirm it&apos;s you and finish creating your account.</p>
          ) : (
            <>
              <p className="hint-text">Enter the 6-digit code we sent to <b>{email}</b>.</p>
              <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" placeholder="6-digit code" required />
              <p className="auth-switch">
                <button type="button" onClick={sendCode} disabled={submitting || resendCooldown > 0}>
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Didn't get a code? Resend"}
                </button>
                {' · '}
                <button type="button" onClick={() => { setOtpSent(false); setCode(''); setError(''); setResendCooldown(0); setStep(1); }}>
                  Use a different email
                </button>
              </p>
            </>
          )}
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      <div className="wizard-actions">
        {step > 0 && step < lastStep && <button type="button" className="wizard-back" onClick={back}>← Back</button>}
        {step > 0 && step === lastStep && <button type="button" className="wizard-back" onClick={back}>← Back</button>}
        {step < lastStep && <button type="button" onClick={next}>Continue →</button>}
        {step === lastStep && !otpSent && <button type="button" onClick={sendCode} disabled={submitting}>{submitting ? 'Sending code…' : 'Send code →'}</button>}
        {step === lastStep && otpSent && <button type="button" onClick={verifyCode} disabled={submitting}>{submitting ? 'Verifying…' : 'Verify & create account →'}</button>}
      </div>

      <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
    </div>
  );
}
