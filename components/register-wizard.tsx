'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
type Role = 'CUSTOMER' | 'PROFESSIONAL';
type AccountType = 'INDIVIDUAL' | 'BUSINESS';
const SECURITY_QUESTIONS = ['What was the name of your first pet?','What was your childhood nickname?','What was the name of your first school?','What city were you born in?'];

function PasswordStrength({password}:{password:string}) {
  const checks=[password.length>=8,/[A-Z]/.test(password),/[a-z]/.test(password),/\d/.test(password),/[^A-Za-z0-9]/.test(password)];
  const score=checks.filter(Boolean).length;
  const label=score<3?'Weak':score<5?'Medium':'Strong';
  return <div className="password-strength" aria-live="polite"><div className="password-strength-head"><span>Password strength</span><b>{password?label:'—'}</b></div><div className="password-strength-bar"><i style={{width:`${score*20}%`}}/></div><small>8+ characters · uppercase · lowercase · number · special character</small></div>;
}

export function RegisterWizard() {
  const router = useRouter();
  const [step,setStep]=useState(0), [role,setRole]=useState<Role|null>(null), [accountType,setAccountType]=useState<AccountType|null>(null);
  const [fullName,setFullName]=useState(''), [businessName,setBusinessName]=useState(''), [registrationNumber,setRegistrationNumber]=useState(''), [email,setEmail]=useState(''), [phone,setPhone]=useState('');
  const [country,setCountry]=useState('Nigeria'), [state,setState]=useState(''), [city,setCity]=useState(''), [area,setArea]=useState(''), [street,setStreet]=useState('');
  const [profession,setProfession]=useState(''), [yearsExperience,setYearsExperience]=useState('');
  const [password,setPassword]=useState(''), [confirmPassword,setConfirmPassword]=useState(''), [showPassword,setShowPassword]=useState(false), [showConfirmPassword,setShowConfirmPassword]=useState(false), [securityQuestion,setSecurityQuestion]=useState(SECURITY_QUESTIONS[0]), [securityAnswer,setSecurityAnswer]=useState(''), [privacyAccepted,setPrivacyAccepted]=useState(false);
  const [googleSignup,setGoogleSignup]=useState(false), [googleName,setGoogleName]=useState(''), [submitting,setSubmitting]=useState(false), [error,setError]=useState(''), [referralCode,setReferralCode]=useState(''), [restoringDraft,setRestoringDraft]=useState(true);
  const [otpSent,setOtpSent]=useState(false), [otpCode,setOtpCode]=useState(''), [otpCooldown,setOtpCooldown]=useState(0);
  const steps=role==='PROFESSIONAL'?['Role','Account type','Personal info','Location','Professional info','Security','Create account']:['Role','Account type','Personal info','Location','Security','Create account'];
  const lastStep=steps.length-1;

  useEffect(()=>{ const params=new URLSearchParams(window.location.search); setReferralCode(params.get('ref')?.toUpperCase() ?? ''); if(params.get('google')==='1'){ setGoogleSignup(true); fetch('/api/auth/google/complete').then(r=>r.json()).then(d=>{if(d.email)setEmail(d.email);if(d.name){setGoogleName(d.name);setFullName(d.name);}}).catch(()=>{}); } try { const raw=sessionStorage.getItem('truxpylot_registration_draft'); if(raw){ const d=JSON.parse(raw) as Record<string,unknown>; if(d.role==='CUSTOMER'||d.role==='PROFESSIONAL')setRole(d.role); if(d.accountType==='INDIVIDUAL'||d.accountType==='BUSINESS')setAccountType(d.accountType); for(const [key,setter] of Object.entries({fullName:setFullName,businessName:setBusinessName,registrationNumber:setRegistrationNumber,email:setEmail,phone:setPhone,country:setCountry,state:setState,city:setCity,area:setArea,street:setStreet,profession:setProfession,yearsExperience:setYearsExperience,securityQuestion:setSecurityQuestion})){const v=d[key];if(typeof v==='string')setter(v)} if(d.privacyAccepted===true)setPrivacyAccepted(true); if(d.otpSent===true&&typeof d.otpEmail==='string'&&d.otpEmail===d.email)setOtpSent(true); } } catch{} setRestoringDraft(false); },[]);
  useEffect(()=>{if(restoringDraft)return; try{sessionStorage.setItem('truxpylot_registration_draft',JSON.stringify({role,accountType,fullName,businessName,registrationNumber,email,phone,country,state,city,area,street,profession,yearsExperience,securityQuestion,privacyAccepted,referralCode,otpSent,otpEmail:otpSent?email:''}))}catch{}},[restoringDraft,role,accountType,fullName,businessName,registrationNumber,email,phone,country,state,city,area,street,profession,yearsExperience,securityQuestion,privacyAccepted,referralCode,otpSent]);
  useEffect(()=>{if(otpCooldown<=0)return;const timer=window.setTimeout(()=>setOtpCooldown(v=>Math.max(0,v-1)),1000);return()=>window.clearTimeout(timer)},[otpCooldown]);
  useEffect(()=>{if(!restoringDraft&&otpSent)setStep(lastStep)},[restoringDraft,otpSent,lastStep]);

  function next(){setError(''); if(step===0&&!role)return setError('Choose an option to continue.'); if(step===1&&!accountType)return setError('Choose an option to continue.'); if(step===2){if(accountType==='BUSINESS'&&(!businessName.trim()||!registrationNumber.trim()||!fullName.trim()||!email.trim()))return setError('Business name, registration number, contact person and email are required.');if(accountType==='INDIVIDUAL'&&(!fullName.trim()||!email.trim()))return setError('Full name and email are required.')} if(step===3&&accountType==='BUSINESS'&&(!state.trim()||!city.trim()||!street.trim()))return setError('Business accounts need a state, city and street/address before continuing.'); const securityStep=role==='PROFESSIONAL'?5:4; if(step===securityStep){if(!googleSignup&&password.length<8)return setError('Create a password with at least 8 characters.');if(!googleSignup&&!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password))return setError('Password must include uppercase, lowercase, a number and a special character.');if(!googleSignup&&password!==confirmPassword)return setError('Passwords do not match.');if(!googleSignup&&(!securityAnswer.trim()||securityAnswer.trim().length<2))return setError('Add an answer to your security question.');if(!privacyAccepted)return setError('Please read and accept the Privacy Policy before continuing.')} setStep(s=>Math.min(lastStep,s+1)); }
  function back(){setError('');setStep(s=>Math.max(0,s-1));}

  function registrationBody(){
    return {
      mode:'register', role, accountType, fullName, email:email.trim().toLowerCase(),
      phone:phone||undefined, businessName:accountType==='BUSINESS'?businessName:undefined,
      registrationNumber:accountType==='BUSINESS'?registrationNumber:undefined,
      country:country||undefined,state:state||undefined,city:city||undefined,
      area:area||undefined,street:street||undefined,
      profession:role==='PROFESSIONAL'?profession||undefined:undefined,
      yearsExperience:role==='PROFESSIONAL'&&yearsExperience?Number(yearsExperience):undefined,
      password,confirmPassword,securityQuestion,securityAnswer,privacyAccepted,
      privacyPolicyVersion:'2026-09-01',referralCode:referralCode||undefined,
    };
  }

  async function requestRegistrationOtp(){
    if(submitting || otpCooldown>0)return;
    setError('');setSubmitting(true);
    try{
      const controller=new AbortController();
      const timeout=window.setTimeout(()=>controller.abort(),25000);
      let r:Response;
      try{
        r=await fetch('/api/auth/otp/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(registrationBody()),signal:controller.signal});
      }finally{window.clearTimeout(timeout)}
      const d=await r.json().catch(()=>({}));
      if(!r.ok){
        if(r.status===429){const retry=Number(r.headers.get('Retry-After')||60);setOtpCooldown(Math.max(1,Math.min(retry,300)))}
        return setError(d.error||'Could not send your verification code. Please try again shortly.');
      }
      setOtpSent(true);setOtpCode('');setOtpCooldown(60);
    }catch(e){
      setError(e instanceof DOMException&&e.name==='AbortError'?'The verification service took too long to respond. Please try again.':'Could not reach the verification service. Check your connection and try again.');
    }finally{setSubmitting(false)}
  }

  async function verifyRegistrationOtp(){
    if(submitting)return;
    const code=otpCode.replace(/\D/g,'').slice(0,6);
    if(code.length!==6)return setError('Enter the 6-digit code sent to your email.');
    setError('');setSubmitting(true);
    try{
      const controller=new AbortController();
      const timeout=window.setTimeout(()=>controller.abort(),25000);
      let r:Response;
      try{
        r=await fetch('/api/auth/otp/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),code}),signal:controller.signal});
      }finally{window.clearTimeout(timeout)}
      const d=await r.json().catch(()=>({}));
      if(!r.ok)return setError(d.error||'That verification code could not be accepted. Please try again.');
      try{sessionStorage.removeItem('truxpylot_registration_draft')}catch{}
      router.push(new URLSearchParams(window.location.search).get('next')||d.redirect||'/dashboard');router.refresh();
    }catch(e){
      setError(e instanceof DOMException&&e.name==='AbortError'?'Verification took too long. Please try again.':'Could not reach the verification service. Check your connection and try again.');
    }finally{setSubmitting(false)}
  }

  async function createAccount(){
    if(submitting)return;
    if(googleSignup){
      setError('');setSubmitting(true);
      try{
        const r=await fetch('/api/auth/google/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,accountType,businessName:accountType==='BUSINESS'?businessName:undefined,registrationNumber:accountType==='BUSINESS'?registrationNumber:undefined,phone:phone||undefined,country:country||undefined,state:state||undefined,city:city||undefined,area:area||undefined,street:street||undefined,profession:role==='PROFESSIONAL'?profession||undefined:undefined,yearsExperience:role==='PROFESSIONAL'&&yearsExperience?Number(yearsExperience):undefined,privacyAccepted,privacyPolicyVersion:'2026-09-01',referralCode:referralCode||undefined})});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)return setError(d.error||'Google sign-up could not be completed.');
        try{sessionStorage.removeItem('truxpylot_registration_draft')}catch{}
        router.push(new URLSearchParams(window.location.search).get('next')||d.redirect||'/dashboard');router.refresh();
      }catch{setError('Could not reach the server. Check your connection and try again.')}finally{setSubmitting(false)}
      return;
    }
    await requestRegistrationOtp();
  }

  return <div className="auth-form register-wizard" aria-busy={restoringDraft||submitting}>
    <p className="eyebrow">JOIN TRUX PYLOT</p><h1>Create your account</h1><p>Find work or trusted help. It only takes a minute to begin.</p>
    <div className="wizard-progress">{steps.map((label,i)=><div key={label} className={`wizard-step-dot ${i===step?'active':i<step?'done':''}`}><span>{i<step?'✓':i+1}</span>{label}</div>)}</div>
    {step===0&&<div className="role-picker"><p className="wizard-question">What are you here to do?</p><button type="button" className={`role-card ${role==='CUSTOMER'?'selected':''}`} onClick={()=>setRole('CUSTOMER')}><b>I need a professional / I have a job</b><span>Find trusted help or post a job for professionals.</span></button><button type="button" className={`role-card ${role==='PROFESSIONAL'?'selected':''}`} onClick={()=>setRole('PROFESSIONAL')}><b>I want to offer my services</b><span>Get verified and start receiving job requests.</span></button></div>}
    {step===1&&<div className="role-picker"><p className="wizard-question">{role==='PROFESSIONAL'?'Are you registering as an individual or a business?':'Are you signing up as an individual or a business?'}</p><button type="button" className={`role-card ${accountType==='INDIVIDUAL'?'selected':''}`} onClick={()=>setAccountType('INDIVIDUAL')}><b>Individual</b><span>{role==='PROFESSIONAL'?'You personally offer the service.':'You are booking for yourself.'}</span></button><button type="button" className={`role-card ${accountType==='BUSINESS'?'selected':''}`} onClick={()=>setAccountType('BUSINESS')}><b>Business / Organization</b><span>{role==='PROFESSIONAL'?'A registered company offering the service.':'You are booking on behalf of a company or estate.'}</span></button></div>}
    {step===2&&<div className="wizard-fields">{accountType==='BUSINESS'&&<><input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Business / company name" required/><input value={registrationNumber} onChange={e=>setRegistrationNumber(e.target.value)} placeholder="CAC registration number" required/></>}<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder={accountType==='BUSINESS'?'Contact person’s full name':'Full name'} required/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" required/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="WhatsApp phone number"/></div>}
    {step===3&&<div className="wizard-fields"><select value={country} onChange={e=>setCountry(e.target.value)}><option>Nigeria</option><option>Ghana</option><option>Other</option></select><select value={state} onChange={e=>setState(e.target.value)}><option value="">Select state</option>{NG_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select><input value={city} onChange={e=>setCity(e.target.value)} placeholder="City"/><input value={area} onChange={e=>setArea(e.target.value)} placeholder="Area / neighbourhood"/><input value={street} onChange={e=>setStreet(e.target.value)} placeholder="Street / address"/></div>}
    {role==='PROFESSIONAL'&&step===4&&<div className="wizard-fields"><input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="What service do you provide? e.g. Electrician"/><input value={yearsExperience} onChange={e=>setYearsExperience(e.target.value)} type="number" min={0} max={60} placeholder="Years of experience"/><p className="hint-text">You can add skills, a bio, your photo and portfolio after signing up.</p></div>}
    {((role==='PROFESSIONAL'&&step===5)||(role!=='PROFESSIONAL'&&step===4))&&<div className="wizard-fields">{googleSignup?<p className="hint-text"><b>Google account selected.</b><br/>Your Google identity is confirmed. Your account will be created without an email OTP. You can verify your email later as a separate security step.</p>:<><p className="hint-text"><b>Secure your account from day one.</b><br/>Use a unique password and choose a security question you can remember. Your answer is stored securely and is never visible to staff.</p><div className="password-field"><input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?'text':'password'} minLength={8} placeholder="Create password (8+ characters)" autoComplete="new-password" required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?'Hide':'Show'}</button></div><PasswordStrength password={password}/><div className="password-field"><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type={showConfirmPassword?'text':'password'} minLength={8} placeholder="Confirm password" autoComplete="new-password" required/><button type="button" className="password-toggle" onClick={()=>setShowConfirmPassword(v=>!v)} aria-label={showConfirmPassword?'Hide password':'Show password'}>{showConfirmPassword?'Hide':'Show'}</button></div>{confirmPassword&&<p className={`password-match ${password===confirmPassword?'ok':'err'}`}>{password===confirmPassword?'Passwords match ✓':'Passwords do not match'}</p>}<select value={securityQuestion} onChange={e=>setSecurityQuestion(e.target.value)}>{SECURITY_QUESTIONS.map(q=><option key={q}>{q}</option>)}</select><input value={securityAnswer} onChange={e=>setSecurityAnswer(e.target.value)} placeholder="Your answer" autoComplete="off" required/></>}<label className="privacy-consent"><input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)}/><span>I have read and accept the <a href="/privacy" target="_blank" rel="noreferrer">TruxPylot Privacy Policy</a> and understand how my information is collected and used.</span></label><p className="hint-text">Your information is used to provide, secure and improve TruxPylot. We do not sell your personal information for advertising.</p></div>}
    {step===lastStep&&<div className="wizard-fields">{otpSent&&!googleSignup?<><p className="hint-text"><b>Check your email</b><br/>We sent a 6-digit verification code to <b>{email}</b>. Enter it below to complete your TruxPylot account.</p><input value={otpCode} onChange={e=>{setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6));setError('')}} inputMode="numeric" maxLength={6} placeholder="6-digit verification code" autoComplete="one-time-code" autoFocus required/><button type="button" className="wizard-back" onClick={()=>{setOtpSent(false);setOtpCode('');setOtpCooldown(0);setError('');setStep(2)}}>← Use a different email</button><p className="hint-text">Didn't receive it? {otpCooldown>0?`You can request another code in ${otpCooldown}s.`:<button type="button" className="password-toggle" onClick={requestRegistrationOtp}>Resend code</button>}</p></>:<><p className="hint-text">Your account is ready to be created. Click below and we’ll send a 6-digit verification code to your email.</p><p className="hint-text"><b>Email:</b> {email}</p><p className="hint-text">Your account will only be completed after the email code is verified.</p></>}</div>}
    {error&&<p role="alert">{error}</p>}
    <div className="wizard-actions">{step>0&&!otpSent&&<button type="button" className="wizard-back" onClick={back}>← Back</button>}{step<lastStep&&<button type="button" onClick={next}>Continue →</button>}{step===lastStep&&!otpSent&&<button type="button" onClick={createAccount} disabled={submitting}>{submitting?'Sending code…':'Create account →'}</button>}{step===lastStep&&otpSent&&!googleSignup&&<button type="button" onClick={verifyRegistrationOtp} disabled={submitting||otpCode.replace(/\D/g,'').length!==6}>{submitting?'Verifying…':'Verify & create account →'}</button>}</div>
    <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
  </div>;
}
