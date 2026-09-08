'use client';
import { useState } from 'react';
export function WalletActions() {
  const [amount, setAmount] = useState('5000');
  const [message, setMessage] = useState('');
  async function fund() {
    setMessage('');
    const r = await fetch('/api/wallet/fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(Number(amount) * 100) }) });
    const body = await r.json();
    if (r.ok && body.authorizationUrl) window.location.href = body.authorizationUrl;
    else setMessage(body.error ?? 'Unable to start funding.');
  }
  return <div className="wallet-actions"><label>Fund wallet (₦)<input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="100" /></label><button className="primary" onClick={fund}>Fund securely with Paystack</button>{message && <small>{message}</small>}</div>;
}
