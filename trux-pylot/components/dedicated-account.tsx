'use client';

// Bank details are always loaded from the authenticated server endpoint.
import { useEffect, useState } from 'react';
export function DedicatedAccount() {
  const [account, setAccount] = useState<{ accountNumber?: string; accountName?: string; bankName?: string } | null>(null);
  const [message, setMessage] = useState('Preparing your wallet bank account…');
  async function load(refresh = false) {
    setMessage('Preparing your wallet bank account…');
    const response = await fetch(`/api/wallet/dedicated-account${refresh ? '?refresh=1' : ''}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.accountNumber && body.accountName && body.bankName) {
      setAccount(body);
      setMessage('');
    } else {
      setAccount(null);
      setMessage(response.ok ? 'Your bank account is still being prepared. Please try again shortly.' : body.error ?? 'Bank transfer details are unavailable.');
    }
  }
  useEffect(() => { load(); }, []);
  if (!account) return <div className="empty">{message}</div>;
  return <div><p>Transfer to this account to fund your wallet. Your balance updates after Paystack confirms the transfer.</p><div className="table-row"><b>{account.bankName}</b><span>{account.accountName}</span><strong>{account.accountNumber}</strong><button onClick={() => navigator.clipboard?.writeText(account.accountNumber ?? '')}>Copy</button></div><button className="secondary" onClick={() => load(true)}>I've made a transfer</button>{message && <small>{message}</small>}</div>;
}
