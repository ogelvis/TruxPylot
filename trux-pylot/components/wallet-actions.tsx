'use client';

import { useState } from 'react';

type PayoutAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  verified: boolean;
};

type WalletActionsProps = {
  availableBalance: number;
  payoutAccount: PayoutAccount | null;
  withdrawOnly?: boolean;
};

export function WalletActions({ availableBalance, payoutAccount, withdrawOnly = false }: WalletActionsProps) {
  const [amount, setAmount] = useState('5000');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payout, setPayout] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [message, setMessage] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    const amountInKobo = Math.round(Number(withdrawAmount) * 100);
    setWithdrawError('');
    if (!Number.isFinite(amountInKobo) || amountInKobo < 200000) {
      setWithdrawError('Minimum withdrawal is ₦2,000.');
      return;
    }
    if (amountInKobo > availableBalance) {
      setWithdrawError('Insufficient wallet balance.');
      return;
    }
    if (!payoutAccount) {
      setWithdrawError('Add a payout account before requesting a withdrawal.');
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmWithdrawal() {
    const amountInKobo = Math.round(Number(withdrawAmount) * 100);
    if (!payoutAccount) {
      setWithdrawError('Add a payout account before requesting a withdrawal.');
      setConfirmOpen(false);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        amount: amountInKobo,
        bankName: payoutAccount.bankName,
        accountName: payoutAccount.accountName,
        accountNumber: payoutAccount.accountNumber,
      }),
    });
    const body = await response.json();
    setMessage(response.ok ? 'Withdrawal requested and queued for review.' : body.error ?? 'Unable to request withdrawal.');
    setSubmitting(false);
    if (response.ok) setConfirmOpen(false);
  }

  return (
    <div className="wallet-actions">
      {!withdrawOnly && <div className="wallet-action-panel">
        <div className="wallet-panel-header-inline">
          <span>Quick top-up</span>
          <strong>Secure</strong>
        </div>
        <label className="wallet-field">
          <span>Amount (₦)</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="100" inputMode="numeric" />
        </label>
        <button type="button" className="wallet-cta primary" onClick={fund}>Fund securely with Paystack</button>
      </div>}

      {!withdrawOnly && <div className="wallet-action-panel">
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
      </div>}

      <div className="wallet-action-panel">
        <div className="wallet-panel-header-inline">
          <span>Withdraw</span>
          <strong>Review</strong>
        </div>
        <label className="wallet-field">
          <span>Withdraw amount (₦)</span>
          <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" min="2000" inputMode="numeric" />
        </label>
        <div className="wallet-withdraw-summary">
          <span>Available balance</span>
          <strong>₦{(availableBalance / 100).toLocaleString('en-NG')}</strong>
        </div>
        {!payoutAccount && <p className="wallet-message wallet-warning">No payout account added yet. Add one above before withdrawing.</p>}
        {payoutAccount && <p className="wallet-payout-note">Payout: {payoutAccount.bankName} · {payoutAccount.accountName} · ••••{payoutAccount.accountNumber.slice(-4)} · {payoutAccount.verified ? 'Verified' : 'Pending verification'}</p>}
        <button type="button" className="wallet-cta primary" onClick={withdraw} disabled={submitting}>{submitting ? 'Submitting…' : 'Request withdrawal'}</button>
        {withdrawError && <p className="wallet-message wallet-error">{withdrawError}</p>}
      </div>

      {message && <p className="wallet-message">{message}</p>}
      {confirmOpen && payoutAccount && <div className="wallet-confirm-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
        <div className="wallet-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirmation" onClick={event => event.stopPropagation()}>
          <span className="wallet-kicker">FINAL CHECK</span>
          <h3 id="withdrawal-confirmation">Confirm withdrawal</h3>
          <p>Review the payout details before sending your request for approval.</p>
          <div className="wallet-confirm-details">
            <span>Amount to withdraw</span><strong>₦{Number(withdrawAmount).toLocaleString('en-NG')}</strong>
            <span>Payout bank</span><strong>{payoutAccount.bankName}</strong>
            <span>Account</span><strong>{payoutAccount.accountName} · ••••{payoutAccount.accountNumber.slice(-4)}</strong>
          </div>
          <div className="wallet-confirm-actions">
            <button type="button" className="wallet-cta secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button type="button" className="wallet-cta primary" onClick={confirmWithdrawal} disabled={submitting}>{submitting ? 'Submitting…' : 'Confirm withdrawal'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
