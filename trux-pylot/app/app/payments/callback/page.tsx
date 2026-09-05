'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get('reference');
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) { setState('error'); return; }
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const r = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference!)}`);
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (r.ok && d?.status === 'SUCCESS') {
          setJobId(d.jobId);
          setState('success');
          return;
        }
        if (d?.jobId) setJobId(d.jobId);
        if (attempts < 6) {
          setTimeout(poll, 2500);
        } else {
          setState('pending');
        }
      } catch {
        if (!cancelled && attempts < 6) setTimeout(poll, 2500);
        else if (!cancelled) setState('error');
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [reference]);

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
        <h1>{state === 'success' ? 'Payment confirmed.' : 'Confirming your payment.'}</h1>
        <p>We verify every payment directly with Paystack before activating a job — this only takes a moment.</p>
      </aside>
      <div className="auth-main">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          {state === 'checking' && <p>Checking your payment status…</p>}
          {state === 'success' && (
            <>
              <p className="form-status ok">Your payment was successful. The job is now active.</p>
              {jobId && <Link className="primary" href={`/dashboard/customer/jobs/${jobId}`}>View job →</Link>}
            </>
          )}
          {state === 'pending' && (
            <>
              <p className="login-notice">
                Paystack hasn&apos;t confirmed this payment yet. If money left your account, it can take a few
                minutes to reflect — check back on your job page shortly.
              </p>
              {jobId && <Link className="primary" href={`/dashboard/customer/jobs/${jobId}`}>Go to job →</Link>}
            </>
          )}
          {state === 'error' && (
            <>
              <p className="form-status err">We couldn&apos;t confirm this payment automatically.</p>
              <button className="primary" type="button" onClick={() => router.push('/dashboard/customer/jobs')}>
                Go to my requests →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-main"><p>Loading…</p></div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
