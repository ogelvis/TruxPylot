'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function WalletFundingStatusContent() {
  const params = useSearchParams();
  const reference = params.get('reference') ?? params.get('txref');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference || !reference.startsWith('TP-FUND-')) return;
    const fundingReference = reference;

    let cancelled = false;
    let attempts = 0;

    async function verify() {
      attempts += 1;
      try {
        const response = await fetch(`/api/wallet/verify?reference=${encodeURIComponent(fundingReference)}`, {
          cache: 'no-store',
        });
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.ok && body.status === 'SUCCESS') {
          setMessage('Payment confirmed. Refreshing your MVault balance…');
          window.setTimeout(() => {
            if (!cancelled) window.location.replace('/dashboard/professional/wallet');
          }, 250);
          return;
        }

        setMessage('Payment received. Confirming your MVault update…');
        if (attempts < 20) window.setTimeout(verify, 1500);
      } catch {
        if (!cancelled && attempts < 20) {
          setMessage('Payment received. Checking your MVault update…');
          window.setTimeout(verify, 1500);
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!message) return null;
  return <p className="wallet-funding-status" role="status">{message}</p>;
}

export function WalletFundingStatus() {
  return <Suspense fallback={null}><WalletFundingStatusContent /></Suspense>;
}
