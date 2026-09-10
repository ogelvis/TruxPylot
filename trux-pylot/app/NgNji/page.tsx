'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [sent,setSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function sendCode(e?:FormEvent) {
    e?.preventDefault();
    setBusy(true); setError('');
    try {
      const r=await fetch('/api/auth/otp/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'admin-login',email})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.error||'Could not start administrative sign in.');return;}
      setSent(true);
    } catch { setError('Could not reach the server.'); }
    finally { setBusy(false); }
  }

  async function verify(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r=await fetch('/api/auth/otp/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.error||'Invalid or expired code.');return;}
      router.replace('/dashboard/admin'); router.refresh();
    } catch { setError('Could not reach the server.'); }
    finally { setBusy(false); }
  }

  return <main className="tp-admin-gate">
    <section className="tp-admin-card">
      <div className="tp-admin-mark">TP</div>
      <p className="eyebrow">SECURE ADMIN ACCESS</p>
      <h1>TruxPylot Control Center</h1>
      <p>Authorized administrators only.</p>
      {!sent ? <form onSubmit={sendCode}>
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label>
        <button disabled={busy}>{busy?'Sending…':'Continue securely →'}</button>
      </form> : <form onSubmit={verify}>
        <label>Verification code<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" maxLength={10} required autoComplete="one-time-code"/></label>
        <button disabled={busy}>{busy?'Verifying…':'Verify & enter →'}</button>
        <button type="button" className="tp-admin-secondary" onClick={()=>{setSent(false);setCode('');setError('')}}>Use another email</button>
      </form>}
      {error&&<p className="tp-admin-error" role="alert">{error}</p>}
    </section>
  </main>;
}
