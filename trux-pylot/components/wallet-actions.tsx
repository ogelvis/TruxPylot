'use client';

import { useEffect, useState } from 'react';

type PayoutAccount = { bankName:string; accountName:string; accountNumber:string; bankCode?:string|null; verified:boolean; verifiedAt?:string|null };
type Bank = { id:number; name:string; code:string };
type WalletActionSection = 'all' | 'fund' | 'payout' | 'withdraw';
type WalletActionsProps = { availableBalance:number; payoutAccount:PayoutAccount|null; withdrawOnly?:boolean; section?:WalletActionSection };

export function WalletActions({ availableBalance, payoutAccount, withdrawOnly=false, section }:WalletActionsProps){
  const mode:WalletActionSection = section ?? (withdrawOnly ? 'withdraw' : 'all');
  const [amount,setAmount]=useState('5000');
  const [withdrawAmount,setWithdrawAmount]=useState('');
  const [payout,setPayout]=useState({bankName:payoutAccount?.bankName??'',accountName:payoutAccount?.accountName??'',accountNumber:payoutAccount?.accountNumber??'',bankCode:payoutAccount?.bankCode??''});
  const [banks,setBanks]=useState<Bank[]>([]);
  const [message,setMessage]=useState('');
  const [withdrawError,setWithdrawError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [verifying,setVerifying]=useState(false);
  const [accountLookup,setAccountLookup]=useState(false);

  useEffect(()=>{fetch('/api/wallet/payout-account/banks',{cache:'force-cache'}).then(r=>r.json()).then(b=>setBanks(b.banks??[])).catch(()=>undefined);},[]);
  useEffect(()=>{if(payoutAccount)setPayout({bankName:payoutAccount.bankName,accountName:payoutAccount.accountName,accountNumber:payoutAccount.accountNumber,bankCode:payoutAccount.bankCode??''});},[payoutAccount]);

  async function fund(){setMessage('');const r=await fetch('/api/wallet/fund',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:Math.round(Number(amount)*100)})});const b=await r.json();if(r.ok&&b.authorizationUrl){window.location.href=b.authorizationUrl;return;}setMessage(b.error??'Unable to start funding.');}
  async function verifyPayout(nextPayout=payout){setVerifying(true);setMessage('');const r=await fetch('/api/wallet/payout-account/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bankCode:nextPayout.bankCode,bankName:nextPayout.bankName,accountNumber:nextPayout.accountNumber})});const b=await r.json();setVerifying(false);if(!r.ok){setPayout(p=>({...p,accountName:'',bankName:nextPayout.bankName}));setMessage(b.error??'Unable to verify bank account.');return;}setPayout({bankName:b.account.bankName,accountName:b.account.accountName,accountNumber:b.account.accountNumber,bankCode:b.account.bankCode??''});setMessage('✓ Account name verified by Paystack. Ready for withdrawals.');window.setTimeout(()=>window.location.reload(),700);}
  useEffect(()=>{
    const key=`${payout.bankCode}:${payout.accountNumber}`;
    const savedKey=payoutAccount?`${payoutAccount.bankCode??''}:${payoutAccount.accountNumber}`:'';
    if(!payout.bankCode||payout.accountNumber.length!==10||key===savedKey) return;
    setAccountLookup(true);
    setPayout(p=>({...p,accountName:''}));
    const timer=window.setTimeout(()=>{verifyPayout(payout).finally(()=>setAccountLookup(false));},450);
    return()=>window.clearTimeout(timer);
  },[payout.bankCode,payout.accountNumber,payoutAccount?.bankCode,payoutAccount?.accountNumber]);
  function withdraw(){const amountInKobo=Math.round(Number(withdrawAmount)*100);setWithdrawError('');if(!Number.isFinite(amountInKobo)||amountInKobo<20000){setWithdrawError('Minimum withdrawal is ₦200.');return;}if(amountInKobo>availableBalance){setWithdrawError('Insufficient wallet balance.');return;}if(!payoutAccount||!payoutAccount.verified){setWithdrawError('Verify your payout bank account before withdrawing.');return;}setConfirmOpen(true);}
  async function confirmWithdrawal(){const amountInKobo=Math.round(Number(withdrawAmount)*100);if(!payoutAccount?.verified){setWithdrawError('Verify your payout bank account before withdrawing.');setConfirmOpen(false);return;}if(submitting)return;setSubmitting(true);const r=await fetch('/api/wallet',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({amount:amountInKobo})});const b=await r.json();setMessage(r.ok?'Withdrawal submitted. It is now being processed securely.':b.error??'Unable to request withdrawal.');setSubmitting(false);if(r.ok){setConfirmOpen(false);window.setTimeout(()=>window.location.reload(),700);}}

  const showFund = mode==='all' || mode==='fund';
  const showPayout = mode==='all' || mode==='payout';
  const showWithdraw = mode==='all' || mode==='withdraw';

  return <div className="wallet-actions">
    {showFund&&<div className="wallet-action-panel"><div className="wallet-panel-header-inline"><span>Quick top-up</span><strong>Secure</strong></div><p className="wallet-action-copy">Add money instantly through your secure Paystack checkout.</p><label className="wallet-field"><span>Amount (₦)</span><input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="100" inputMode="numeric"/></label><button type="button" className="wallet-cta primary" onClick={fund}>Fund securely with Paystack</button></div>}

    {showPayout&&<div className="wallet-action-panel"><div className="wallet-panel-header-inline"><span>Verified payout account</span><strong>{payoutAccount?.verified?'Verified':'Required'}</strong></div><p className="wallet-action-copy">Choose where approved withdrawals should be sent.</p><div className="wallet-form-grid"><select value={payout.bankCode} onChange={e=>{const bank=banks.find(x=>x.code===e.target.value);setPayout({...payout,bankCode:e.target.value,bankName:bank?.name??''})}}><option value="">Select bank</option>{banks.map(b=><option value={b.code} key={b.code}>{b.name}</option>)}</select><input placeholder="Account number" inputMode="numeric" maxLength={10} value={payout.accountNumber} onChange={e=>setPayout({...payout,accountNumber:e.target.value.replace(/\D/g,'').slice(0,10)})}/><input placeholder={accountLookup?'Fetching account name…':'Account name (auto-verified)'} value={payout.accountName} readOnly aria-readonly="true"/></div><div className="wallet-inline-actions">{accountLookup&&<span className="wallet-payout-note">Verifying account with Paystack…</span>}{payout.accountName&&!accountLookup&&<span className="wallet-payout-note">✓ Account name verified</span>}</div>{payoutAccount&&<p className="wallet-payout-note">{payoutAccount.bankName} · {payoutAccount.accountName} · ••••{payoutAccount.accountNumber.slice(-4)} · {payoutAccount.verified?'Verified':'Not verified'}</p>}</div>}

    {showWithdraw&&<div className="wallet-action-panel wallet-withdraw-action"><div className="wallet-panel-header-inline"><span>Withdraw</span><strong>{payoutAccount?.verified?'Ready':'Verify bank first'}</strong></div><p className="wallet-action-copy">Request a payout from your available wallet balance.</p><label className="wallet-field"><span>Withdraw amount (₦)</span><input value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} type="number" min="200" inputMode="numeric" placeholder="Minimum ₦200"/></label><div className="wallet-withdraw-summary"><span>Available balance</span><strong>₦{(availableBalance/100).toLocaleString('en-NG')}</strong></div>{!payoutAccount&&<p className="wallet-message wallet-warning">Add and verify a payout account before withdrawing.</p>}{payoutAccount&&!payoutAccount.verified&&<p className="wallet-message wallet-warning">Your bank account must be verified before a withdrawal can be submitted.</p>}{payoutAccount?.verified&&<p className="wallet-payout-note">Payout: {payoutAccount.bankName} · {payoutAccount.accountName} · ••••{payoutAccount.accountNumber.slice(-4)} · Verified</p>}<button type="button" className="wallet-cta primary" onClick={withdraw} disabled={submitting}>{submitting?'Submitting…':'Request withdrawal'}</button>{withdrawError&&<p className="wallet-message wallet-error">{withdrawError}</p>}</div>}

    {message&&<p className="wallet-message">{message}</p>}
    {showWithdraw&&confirmOpen&&payoutAccount&&<div className="wallet-confirm-backdrop" role="presentation" onClick={()=>setConfirmOpen(false)}><div className="wallet-confirm-modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><span className="wallet-kicker">FINAL CHECK</span><h3>Confirm withdrawal</h3><p>Your request will reserve the amount and continue through the secure Paystack payout process.</p><div className="wallet-confirm-details"><span>Amount</span><strong>₦{Number(withdrawAmount).toLocaleString('en-NG')}</strong><span>Bank</span><strong>{payoutAccount.bankName}</strong><span>Account</span><strong>{payoutAccount.accountName} · ••••{payoutAccount.accountNumber.slice(-4)}</strong></div><div className="wallet-confirm-actions"><button type="button" className="wallet-cta secondary" onClick={()=>setConfirmOpen(false)}>Cancel</button><button type="button" className="wallet-cta primary" onClick={confirmWithdrawal} disabled={submitting}>{submitting?'Submitting…':'Confirm withdrawal'}</button></div></div></div>}
  </div>;
}
