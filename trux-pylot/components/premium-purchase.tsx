'use client';
import { useState } from 'react';

export function PremiumPurchase({ priceLabel }: { priceLabel: string }) {
  const [stage, setStage] = useState<'idle' | 'confirm' | 'redirecting' | 'error'>('idle');
  const [error, setError] = useState('');

  async function startPayment() {
    setError('');
    setStage('redirecting');
    try {
      const r = await fetch('/api/payments/premium/initialize', { method: 'POST' });
      const d = await r.json().catch(() => ({ error: 'Could not start payment.' }));
      if (!r.ok) throw new Error(d.error || 'Could not start payment.');
      window.location.href = d.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.');
      setStage('error');
    }
  }

  if (stage === 'confirm' || stage === 'redirecting' || stage === 'error') {
    return (
      <div className="premium-confirm-card">
        <p className="premium-confirm-label">Premium Access</p>
        <p className="premium-confirm-note">One-time payment — no recurring charges</p>
        <ul className="premium-confirm-list">
          <li>Premium badge on your public profile</li>
          <li>Higher placement in marketplace search results</li>
          <li>Premium status shown to customers and CSD</li>
        </ul>
        <p className="premium-confirm-price">{priceLabel}</p>
        {error && <p className="form-status err">{error}</p>}
        <div className="premium-confirm-actions">
          <button
            type="button"
            className="btn-premium-buy"
            disabled={stage === 'redirecting'}
            onClick={startPayment}
          >
            {stage === 'redirecting' ? 'Redirecting to payment…' : stage === 'error' ? 'Retry payment' : 'Continue to payment'}
          </button>
          <button
            type="button"
            className="btn-premium-cancel"
            disabled={stage === 'redirecting'}
            onClick={() => { setStage('idle'); setError(''); }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="btn-premium-unlock" onClick={() => setStage('confirm')}>
      Unlock Premium
    </button>
  );
}
