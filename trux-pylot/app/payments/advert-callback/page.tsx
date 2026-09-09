'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AdvertPaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');

  useEffect(() => {
    const reference = params.get('reference');
    if (!reference) { setState('error'); return; }
    let cancelled = false;
    fetch(`/api/advertising/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok && d.active) setState('success');
        else setState('pending');
      })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [params]);

  return <main className="auth-page"><section className="auth-aside"><img src="/trux-pylot-logo.png" alt="Trux Pylot"/><h1>{state === 'success' ? 'Your advert is live.' : 'Confirming your advert.'}</h1><p>We verify advertising payments directly with Paystack before activating your placement.</p></section><section className="auth-main"><div className="auth-form-wrap"><p className="eyebrow">INSTANT ADVERT</p>{state === 'checking' && <><h1>Confirming payment…</h1><p>Please wait while we verify your transaction.</p></>}{state === 'success' && <><h1>Advert activated.</h1><p>Your advertising package is now active on Trux Pylot.</p><button type="button" onClick={() => router.push('/dashboard/professional/growth')}>Go to Growth Center →</button></>}{state === 'pending' && <><h1>Payment received.</h1><p>Your payment is still being confirmed. Your current advertising state will update as soon as Paystack confirms it.</p><button type="button" onClick={() => router.push('/dashboard/professional/growth')}>Go to Growth Center →</button></>}{state === 'error' && <><h1>We could not confirm it.</h1><p>Return to Growth Center and check your advertising status.</p><button type="button" onClick={() => router.push('/dashboard/professional/growth')}>Return to Growth Center →</button></>}</div></section></main>;
}

export default function AdvertPaymentCallback() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-main"><div className="auth-form-wrap"><p>Loading payment confirmation…</p></div></section></main>}><AdvertPaymentCallbackContent /></Suspense>;
}
