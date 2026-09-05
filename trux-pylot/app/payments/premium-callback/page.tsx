'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get('reference');
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');

  useEffect(() => {
    if (!reference) { setState('error'); return; }
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const r = await fetch(`/api/payments/premium/verify?reference=${encodeURIComponent(reference!)}`);
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (r.ok && d?.status === 'SUCCESS') {
          setState('success');
          return;
        }
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
      <aside className="auth-aside premium-aside">
        <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
        <h1>{state === 'success' ? '★ Premium unlocked.' : 'Confirming your payment.'}</h1>
        <p>We verify every payment directly with Paystack before activating Premium — this only takes a moment.</p>
      </aside>
      <div className="auth-main">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          {state === 'checking' && <p>Checking your payment status…</p>}
          {state === 'success' && (
            <>
              <p className="form-status ok">Your professional account is now Premium. Your Premium benefits are active.</p>
              <div className="premium-success-actions">
                <Link className="primary" href="/dashboard/professional/tier">Go to Tier Center →</Link>
                <Link className="primary-ghost" href="/dashboard/professional/profile">View my profile →</Link>
              </div>
            </>
          )}
          {state === 'pending' && (
            <>
              <p className="login-notice">
                Paystack hasn&apos;t confirmed this payment yet. If money left your account, it can take a few
                minutes to reflect — check back on the Tier Center shortly. Your current tier remains unchanged
                until then.
              </p>
              <Link className="primary" href="/dashboard/professional/tier">Go to Tier Center →</Link>
            </>
          )}
          {state === 'error' && (
            <>
              <p className="form-status err">We couldn&apos;t confirm this payment automatically. Your current tier remains unchanged.</p>
              <button className="primary" type="button" onClick={() => router.push('/dashboard/professional/tier')}>
                Go to Tier Center →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PremiumPaymentCallback() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-main"><p>Loading…</p></div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
