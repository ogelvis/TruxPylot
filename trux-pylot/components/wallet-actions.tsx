'use client';

import { useState } from 'react';

export function WalletActions() {
  const [amount, setAmount] = useState('5000');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payout, setPayout] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [message, setMessage] = useState('');

  async function fund() {
    setMessage('');
    const response = await fetch('/api/wallet/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(Number(amount) * 100) }),
    });
    const body = await response.json();
    if (response.ok && body.authorizationUrl) {
      window.location.href = body.authorizationUrl;
      return;
    }
    setMessage(body.error ?? 'Unable to start funding.');
  }

  async function savePayout() {
    const response = await fetch('/api/wallet/payout-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payout),
    });
    const body = await response.json();
    setMessage(response.ok ? 'Payout account saved.' : body.error ?? 'Unable to save payout account.');
  }

  async function withdraw() {
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        amount: Math.round(Number(withdrawAmount) * 100),
        bankName: payout.bankName || 'saved',
        accountName: payout.accountName || 'saved',
        accountNumber: payout.accountNumber || '0000000000',
      }),
    });
    const body = await response.json();
    setMessage(response.ok ? 'Withdrawal requested and queued for review.' : body.error ?? 'Unable to request withdrawal.');
  }

  return (
    <div className="wallet-actions">
      <div className="wallet-action-panel">
        <div className="wallet-panel-header-inline">
          <span>Quick top-up</span>
          <strong>Secure</strong>
        </div>
        <label className="wallet-field">
          <span>Amount (₦)</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="100" inputMode="numeric" />
        </label>
        <button type="button" className="wallet-cta primary" onClick={fund}>Fund securely with Paystack</button>
      </div>

      <div className="wallet-action-panel">
        <div className="wallet-panel-header-inline">
          <span>Payout account</span>
          <strong>Banking</strong>
        </div>
        <div className="wallet-form-grid">
          <input placeholder="Bank name" value={payout.bankName} onChange={e => setPayout({ ...payout, bankName: e.target.value })} />
          <input placeholder="Account name" value={payout.accountName} onChange={e => setPayout({ ...payout, accountName: e.target.value })} />
          <input placeholder="10-digit account number" inputMode="numeric" value={payout.accountNumber} onChange={e => setPayout({ ...payout, accountNumber: e.target.value })} />
        </div>
        <button type="button" className="wallet-cta secondary" onClick={savePayout}>Save payout account</button>
      </div>

      <div className="wallet-action-panel">
        <div className="wallet-panel-header-inline">
          <span>Withdraw</span>
          <strong>Review</strong>
        </div>
        <label className="wallet-field">
          <span>Withdraw amount (₦)</span>
          <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" min="2000" inputMode="numeric" />
        </label>
        <button type="button" className="wallet-cta primary" onClick={withdraw}>Request withdrawal</button>
      </div>

      {message && <p className="wallet-message">{message}</p>}
    </div>
  );
}
