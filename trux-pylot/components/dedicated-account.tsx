'use client';

// Bank details are always loaded from the authenticated server endpoint.
import { useEffect, useState } from 'react';
export function DedicatedAccount() {
  const [account, setAccount] = useState<any>(null); const [message, setMessage] = useState('Loading bank details…');
  async function load(refresh = false) { setMessage('Loading bank details…'); const response = await fetch(`/api/wallet/dedicated-account${refresh ? '?refresh=1' : ''}`); const body = await response.json(); if (response.ok) { setAccount(body); setMessage(''); } else setMessage(body.error ?? 'Bank transfer details are unavailable.'); }
  useEffect(() => { load(); }, []);
  if (!account) return <div className="empty">{message}</div>;
  return <div><p>Transfer to this account to fund your wallet. Your balance updates after Paystack confirms the transfer.</p><div className="table-row"><b>{account.bankName ?? 'Bank'}</b><span>{account.accountName ?? 'Dedicated account'}</span><strong>{account.accountNumber ?? 'Unavailable'}</strong><button onClick={() => navigator.clipboard?.writeText(account.accountNumber ?? '')}>Copy</button></div><button className="secondary" onClick={() => load(true)}>I've made a transfer</button>{message && <small>{message}</small>}</div>;
}
