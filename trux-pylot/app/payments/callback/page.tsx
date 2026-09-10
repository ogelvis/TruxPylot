'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  const reference = params.get('reference');

  const [state, setState] = useState<
    'checking' | 'success' | 'pending' | 'error'
  >('checking');

  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setState('error');
      return;
    }

    const paymentReference = reference;

    let attempts = 0;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) return;

      attempts += 1;

      try {
        const response = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(paymentReference)}`,
          {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
          }
        );

        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (response.ok && data?.status === 'SUCCESS') {
          setJobId(data.jobId ?? null);
          setState('success');
          return;
        }

        if (data?.jobId) {
          setJobId(data.jobId);
        }

        if (attempts < 6) {
          timeout = setTimeout(poll, 2500);
        } else {
          setState('pending');
        }
      } catch {
        if (cancelled) return;

        if (attempts < 6) {
          timeout = setTimeout(poll, 2500);
        } else {
          setState('error');
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [reference]);

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <img src="/trux-pylot-logo.png" alt="Trux Pylot" />

        <h1>
          {state === 'success'
            ? 'Payment confirmed.'
            : 'Confirming your payment.'}
        </h1>

        <p>
          We verify every payment directly with Paystack before activating a
          job. This only takes a moment.
        </p>
      </aside>

      <section className="auth-main">
        <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
          {state === 'checking' && (
            <p>Checking your payment status…</p>
          )}

          {state === 'success' && (
            <>
              <p className="form-status ok">
                Your payment was successful. The job is now active.
              </p>

              {jobId && (
                <Link
                  className="primary"
                  href={`/dashboard/customer/jobs/${jobId}`}
                >
                  View job →
                </Link>
              )}
            </>
          )}

          {state === 'pending' && (
            <>
              <p className="login-notice">
                Paystack hasn&apos;t confirmed this payment yet. If money left
                your account, it can take a few minutes to reflect. Check back
                on your job page shortly.
              </p>

              {jobId && (
                <Link
                  className="primary"
                  href={`/dashboard/customer/jobs/${jobId}`}
                >
                  Go to job →
                </Link>
              )}
            </>
          )}

          {state === 'error' && (
            <>
              <p className="form-status err">
                We couldn&apos;t confirm this payment automatically.
              </p>

              <button
                className="primary"
                type="button"
                onClick={() => router.push('/dashboard/customer/jobs')}
              >
                Go to my requests →
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
