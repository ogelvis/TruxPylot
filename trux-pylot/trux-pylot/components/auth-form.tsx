'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type OtpChannel = 'sms' | 'whatsapp' | 'call';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Phone sign-in (login mode only) ---
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone'>('password');
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'enter-phone' | 'enter-code'>('enter-phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f);
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable. Please try again.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Something went wrong');
      router.push(d.redirect || '/login');
      router.refresh();
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  async function sendPhoneOtp(channel: OtpChannel) {
    setError('');
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) return setError('Enter your number with country code, e.g. +2348012345678');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel }),
      });
      const d = await r.json().catch(() => ({ error: 'The service is temporarily unavailable.' }));
      setSubmitting(false);
      if (!r.ok) return setError(d.error || 'Could not send code. Try again.');
      setOtpChannel(channel);
      setOtpStep('enter-code');
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  async function confirmPhoneLogin() {
    setError('');
    if (!otpCode.trim()) return setError('Enter the code you received.');
    setSubmitting(true);
    try {
      const checkRes = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const checkData = await checkRes.json().catch(() => ({ error: 'The service is temporarily unavailable.' }));
      if (!checkRes.ok || !checkData.approved) {
        setSubmitting(false);
        return setError(checkData.error || 'Incorrect code. Try again.');
      }

      const loginRes = await fetch('/api/auth/phone/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ticket: checkData.ticket }),
      });
      const loginData = await loginRes.json().catch(() => ({ error: 'The service is temporarily unavailable.' }));
      setSubmitting(false);
      if (!loginRes.ok) return setError(loginData.error || 'Could not sign in.');
      router.push(loginData.redirect || '/login');
      router.refresh();
    } catch {
      setSubmitting(false);
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (mode === 'login' && loginMethod === 'phone') {
    return (
      <div className="auth-form">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in with your phone</h1>
        <p>We&apos;ll text, WhatsApp, or call you a one-time code — no password needed.</p>

        {otpStep === 'enter-phone' && (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number, e.g. +2348012345678" />
            <div className="otp-channel-buttons">
              <button type="button" disabled={submitting} onClick={() => sendPhoneOtp('sms')}>Text me a code</button>
              <button type="button" disabled={submitting} onClick={() => sendPhoneOtp('whatsapp')}>WhatsApp me a code</button>
              <button type="button" disabled={submitting} onClick={() => sendPhoneOtp('call')}>Call me with a code</button>
            </div>
          </>
        )}

        {otpStep === 'enter-code' && (
          <>
            <p className="hint-text">
              Enter the code sent via {otpChannel === 'sms' ? 'text message' : otpChannel === 'whatsapp' ? 'WhatsApp' : 'phone call'}.
            </p>
            <input value={otpCode} onChange={e => setOtpCode(e.target.value)} inputMode="numeric" placeholder="6-digit code" />
            <div className="otp-code-actions">
              <button type="button" onClick={confirmPhoneLogin} disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in →'}</button>
              <button type="button" className="otp-resend" onClick={() => sendPhoneOtp(otpChannel)} disabled={submitting}>Resend</button>
            </div>
          </>
        )}

        {error && <p role="alert">{error}</p>}
        <p className="auth-switch">
          <button type="button" className="link-button" onClick={() => { setLoginMethod('password'); setError(''); }}>
            Sign in with password instead
          </button>
        </p>
        <p className="auth-switch">New to Trux Pylot? <a href="/register">Create an account</a></p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN TRUX PYLOT'}</p>
      <h1>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h1>
      <p>{mode === 'login' ? 'Manage jobs, messages and payments in one secure place.' : 'Find work or trusted help. It only takes a minute to begin.'}</p>

      {mode === 'register' && (
        <>
          <input name="fullName" placeholder="Full name" required />
          <select name="role" defaultValue="CUSTOMER">
            <option value="CUSTOMER">I need a professional</option>
            <option value="PROFESSIONAL">I am a professional</option>
          </select>
          <input name="location" placeholder="Your location" required />
        </>
      )}

      <input name="email" type="email" placeholder="Email address" required />
      <input name="password" type="password" minLength={12} placeholder="Password (12+ characters)" required />
      {mode === 'login' && <p className="forgot-link"><a href="/forgot-password">Forgot password?</a></p>}

      <button type="submit" disabled={submitting}>
        {submitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in securely →' : 'Create account →')}
      </button>
      {error && <p role="alert">{error}</p>}

      {mode === 'login' && (
        <p className="auth-switch">
          <button type="button" className="link-button" onClick={() => { setLoginMethod('phone'); setError(''); setOtpStep('enter-phone'); }}>
            Sign in with phone instead
          </button>
        </p>
      )}
      <p className="auth-switch">
        {mode === 'login' ? <>New to Trux Pylot? <a href="/register">Create an account</a></> : <>Already have an account? <a href="/login">Sign in</a></>}
      </p>
    </form>
  );
}
