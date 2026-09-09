'use client';

import { useEffect, useState } from 'react';

export function DedicatedAccount() {
  const [account, setAccount] = useState<{ accountNumber?: string; accountName?: string; bankName?: string; status?: string } | null>(null);
  const [message, setMessage] = useState('Preparing your wallet bank account…');
  const [copied, setCopied] = useState(false);

  async function load(refresh = false) {
    setMessage(refresh ? 'Checking your transfer with Paystack…' : 'Preparing your wallet bank account…');
    const response = await fetch(`/api/wallet/dedicated-account${refresh ? '?refresh=1&check=1' : ''}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));

    if (response.ok && body.accountNumber && body.accountName && body.bankName) {
      setAccount(body);
      setMessage('');
      if (refresh) window.setTimeout(() => window.location.reload(), 2500);
      return;
    }

    setAccount(null);
    setMessage(
      response.ok
        ? refresh
          ? 'Transfer check submitted. Paystack will notify TruxPylot when the transfer is confirmed; refreshing shortly.'
          : `Your bank account is ${body.status === 'ERROR' ? 'temporarily unavailable' : 'still being prepared'}. Please try again shortly.`
        : body.error ?? 'Bank transfer details are unavailable.'
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function copyAccount() {
    if (!account?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setMessage('Copy failed. You can still manually copy the account number.');
    }
  }

  if (!account) {
    return <div className="wallet-empty wallet-bank-empty">{message}</div>;
  }

  return (
    <div className="wallet-bank-shell">
      <p className="wallet-bank-note">Transfer to this account to fund your wallet. Your balance updates after Paystack confirms the transfer.</p>
      <div className="wallet-bank-card">
        <div>
          <span className="wallet-bank-label">Bank</span>
          <strong>{account.bankName}</strong>
        </div>
        <div>
          <span className="wallet-bank-label">Account name</span>
          <strong>{account.accountName}</strong>
        </div>
        <div className="wallet-account-number-wrap">
          <span className="wallet-bank-label">Account number</span>
          <strong>{account.accountNumber}</strong>
        </div>
        <button type="button" className="wallet-copy-button" onClick={copyAccount}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="wallet-bank-actions">
        <button type="button" className="wallet-cta secondary" onClick={() => load(true)}>I've made a transfer — check status</button>
      </div>

      {message && <small className="wallet-meta-note">{message}</small>}
    </div>
  );
}
