'use client';

import { useEffect, useMemo, useState } from 'react';

type Withdrawal = { id:string; amount:number; status:string; bankName?:string|null; accountName?:string|null; accountNumber?:string|null; rejectionReason?:string|null; providerReference?:string|null; providerStatus?:string|null; providerTransferId?:string|null; providerTransferCode?:string|null; createdAt:string; user:{email:string;professional?:{fullName:string}|null} };
type Transaction = { id:string; kind:string; reference?:string|null; amount:number; status:string; source:string; description:string; createdAt:string; user:string; name:string; metadata?:unknown };
type Transfer = { id:string; reference:string; amount:number; status:string; currency?:string|null; createdAt:string; dedicatedAccount?:{accountNumber?:string|null;bankName?:string|null;professional?:{fullName:string;user:{email:string}}|null}|null };
type Account = { id:string; accountNumber?:string|null; accountName?:string|null; bankName?:string|null; status:string; active:boolean; professional:{fullName:string;user:{email:string}} };
type Wallet = { id:string; availableBalance:number; pendingBalance:number; professional:{fullName:string;user:{email:string}}; dedicatedAccount?:{accountNumber?:string|null;bankName?:string|null;status:string;active:boolean}|null };

const money = (n:number) => `₦${(n/100).toLocaleString('en-NG')}`;
const label = (s:string) => s.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export function AdminFinance() {
  const [tab,setTab]=useState<'overview'|'transactions'|'withdrawals'|'incoming'|'wallets'>('overview');
  const [withdrawals,setWithdrawals]=useState<Withdrawal[]>([]);
  const [transactions,setTransactions]=useState<Transaction[]>([]);
  const [transfers,setTransfers]=useState<Transfer[]>([]);
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [wallets,setWallets]=useState<Wallet[]>([]);
  const [selectedTx,setSelectedTx]=useState<Transaction|null>(null);
  const [page,setPage]=useState(1);
  const pageSize=25;
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [otpId,setOtpId]=useState<string|null>(null);
  const [otp,setOtp]=useState('');
  const [rejectId,setRejectId]=useState<string|null>(null);
  const [rejectReason,setRejectReason]=useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [w,t,i,wl] = await Promise.all([
        fetch(`/api/admin/withdrawals${status ? `?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}` : `?search=${encodeURIComponent(search)}`}`,{cache:'no-store'}),
        fetch(`/api/admin/transactions?search=${encodeURIComponent(search)}`,{cache:'no-store'}),
        fetch('/api/admin/dedicated-accounts?status=UNMATCHED',{cache:'no-store'}),
        fetch('/api/admin/wallets',{cache:'no-store'}),
      ]);
      const [wb,tb,ib,wbx]=await Promise.all([w.json(),t.json(),i.json(),wl.json()]);
      if(!w.ok) throw new Error(wb.error||'Unable to load withdrawals.');
      setWithdrawals(wb.withdrawals??[]); setTransactions(tb.transactions??[]); setTransfers(ib.transfers??[]); setAccounts(ib.accounts??[]); setWallets(wbx.wallets??[]); setPage(1);
    } catch(e) { setError(e instanceof Error?e.message:'Unable to load finance data.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load();},[status]);
  const filteredTransactions=useMemo(()=>transactions.filter(t=>!search || `${t.reference??''} ${t.user} ${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase())),[transactions,search]);
  const walletLiability=accounts.length ? 0 : 0;
  const deposits=filteredTransactions.filter(t=>['WALLET_FUNDING','DVA_TRANSFER','JOB_PAYMENT'].includes(t.kind)&&['SUCCESS','COMPLETED'].includes(t.status)).reduce((s,t)=>s+t.amount,0);
  const withdrawalTotal=withdrawals.filter(w=>w.status!=='REJECTED'&&w.status!=='FAILED').reduce((s,w)=>s+w.amount,0);
  const pendingCount=withdrawals.filter(w=>['REQUESTED','REVIEWING','APPROVED'].includes(w.status)).length;
  const chart=useMemo(()=>{const days:Array<{key:string,label:string,value:number}>=[]; for(let i=13;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push({key:d.toISOString().slice(0,10),label:d.toLocaleDateString('en-NG',{day:'numeric',month:'short'}),value:0});} filteredTransactions.forEach(t=>{const k=new Date(t.createdAt).toISOString().slice(0,10);const d=days.find(x=>x.key===k);if(d&&['COMPLETED','SUCCESS','PAID'].includes(t.status))d.value+=t.amount;});return days;},[filteredTransactions]);
  const maxChart=Math.max(1,...chart.map(x=>x.value));
  const pagedTransactions=filteredTransactions.slice((page-1)*pageSize,page*pageSize);
  const totalPages=Math.max(1,Math.ceil(filteredTransactions.length/pageSize));

  async function action(id:string, actionName:string, body:any={}) { setBusy(id); setError(''); try { const r=await fetch(`/api/admin/withdrawals/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:actionName,...body})}); const b=await r.json(); if(!r.ok) throw new Error(b.error||'Action failed.'); if(b.result?.needsOtp) setOtpId(id); await load(); } catch(e){setError(e instanceof Error?e.message:'Action failed.');} finally{setBusy(null);} }

  return <div className="finance-control-center">
    <div className="finance-toolbar"><div className="finance-tabs">{(['overview','transactions','withdrawals','incoming','wallets'] as const).map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{label(x)}</button>)}</div><div className="finance-search"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reference, user, account…"/><button onClick={load}>Refresh</button></div></div>
    {error&&<div className="finance-alert error">{error}</div>}
    {loading&&<div className="finance-loading">Loading live financial records…</div>}
    {!loading&&tab==='overview'&&<>
      <div className="finance-overview-cards"><div className="finance-overview-card"><span>Financial records</span><strong>{filteredTransactions.length}</strong><small>Real database transactions</small></div><div className="finance-overview-card"><span>Transaction volume</span><strong>{money(deposits)}</strong><small>Successful/completed activity</small></div><div className="finance-overview-card"><span>Withdrawal exposure</span><strong>{money(withdrawalTotal)}</strong><small>Requested, approved or paid</small></div><div className="finance-overview-card"><span>Pending withdrawals</span><strong>{pendingCount}</strong><small>Awaiting review or provider completion</small></div></div>
      <section className="finance-chart panel"><div className="panel-head"><div><h2>Transaction volume</h2><p>Completed financial activity across the last 14 days.</p></div></div><div className="finance-bars">{chart.map(x=><div className="finance-bar-col" key={x.key}><div className="finance-bar-track"><i style={{height:`${Math.max(3,(x.value/maxChart)*100)}%`}} title={money(x.value)}/></div><small>{x.label}</small></div>)}</div></section>
      <section className="panel"><div className="panel-head"><div><h2>Recent financial activity</h2><p>Latest records from the ledger and payment systems.</p></div><button className="finance-link" onClick={()=>setTab('transactions')}>View all →</button></div><FinanceTable transactions={filteredTransactions.slice(0,10)} onSelect={setSelectedTx}/></section>
    </>}
    {!loading&&tab==='transactions'&&<section className="panel"><div className="panel-head"><div><h2>All financial transactions</h2><p>Wallet ledger, funding, DVA transfers, job payments and withdrawals.</p></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="COMPLETED">Completed</option><option value="SUCCESS">Success</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option><option value="REVERSED">Reversed</option></select></div><FinanceTable transactions={pagedTransactions} onSelect={setSelectedTx}/><Pagination page={page} totalPages={totalPages} onChange={setPage}/></section>}
    {!loading&&tab==='withdrawals'&&<section className="panel"><div className="panel-head"><div><h2>Wallet withdrawals</h2><p>Review requests, approve real Paystack payouts, reject with a reason and track provider status.</p></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option><option value="REQUESTED">Pending review</option><option value="REVIEWING">Processing</option><option value="APPROVED">Sent to Paystack</option><option value="PAID">Successful</option><option value="FAILED">Failed</option><option value="REJECTED">Rejected</option></select></div>{withdrawals.length===0?<div className="finance-empty">No wallet withdrawals match the current filter.</div>:withdrawals.map(w=><div className="withdrawal-card" key={w.id}><div className="withdrawal-main"><div><span className="finance-overline">{w.user.professional?.fullName??w.user.email}</span><h3>{money(w.amount)}</h3><p>{w.bankName??'Bank unavailable'} · {w.accountName??'Account name unavailable'} · {w.accountNumber?`••••${w.accountNumber.slice(-4)}`:'No account'}</p><small>{new Date(w.createdAt).toLocaleString('en-NG')} · {w.id}</small></div><span className={`finance-status ${w.status.toLowerCase()}`}>{w.status==='PAID'?'SUCCESSFUL':w.status==='REVIEWING'||w.status==='APPROVED'?'PROCESSING':w.status}</span></div><div className="withdrawal-meta"><span>Provider: {w.providerReference??'Not submitted'}</span><span>Paystack: {w.providerStatus??'Awaiting review'}</span>{w.providerTransferId&&<span>Transfer ID: {w.providerTransferId}</span>}{w.rejectionReason&&<span>Reason: {w.rejectionReason}</span>}</div><div className="withdrawal-actions">{w.status==='REQUESTED'&&<><button className="finance-btn primary" disabled={busy===w.id} onClick={()=>action(w.id,'approve')}>{busy===w.id?'Processing…':'Approve & process'}</button><button className="finance-btn danger" onClick={()=>{setRejectId(w.id);setRejectReason('')}}>Reject</button></>}{(w.status==='APPROVED'||w.status==='REVIEWING')&&w.providerTransferCode&&<button className="finance-btn primary" onClick={()=>setOtpId(w.id)}>Enter transfer OTP</button>}</div></div>)}</section>}
    {!loading&&tab==='incoming'&&<section className="panel"><div className="panel-head"><div><h2>Unmatched incoming bank transfers</h2><p>Only transfers that are currently UNMATCHED are shown here.</p></div><button className="finance-link" onClick={load}>Refresh</button></div>{transfers.length===0?<div className="finance-empty">No unmatched bank transfers. Matched transfers are tracked in the financial transaction ledger.</div>:transfers.map(t=><div className="table-row" key={t.id}><b>{money(t.amount)}</b><span>{t.dedicatedAccount?.professional?.fullName??'Unmatched transfer'}</span><strong>{t.status}</strong><small>{t.reference} · {new Date(t.createdAt).toLocaleString('en-NG')}</small></div>)}</section>}
    {!loading&&tab==='wallets'&&<section className="panel"><div className="panel-head"><div><h2>All wallets</h2><p>Current available and pending balances with DVA status.</p></div></div>{wallets.map(w=><div className="table-row" key={w.id}><b>{w.professional.fullName}</b><span>{w.professional.user.email}</span><strong>{money(w.availableBalance)}</strong><small>Pending {money(w.pendingBalance)} · {w.dedicatedAccount?.bankName??'DVA pending'} {w.dedicatedAccount?.accountNumber??''}</small></div>)}</section>}
    {selectedTx&&<div className="finance-modal-backdrop"><div className="finance-modal"><h3>Transaction details</h3><p>{selectedTx.description}</p><div className="finance-detail-grid"><span>Type</span><strong>{label(selectedTx.kind)}</strong><span>Status</span><strong>{selectedTx.status}</strong><span>Amount</span><strong>{money(selectedTx.amount)}</strong><span>Reference</span><strong>{selectedTx.reference??selectedTx.id}</strong><span>User</span><strong>{selectedTx.name} · {selectedTx.user}</strong><span>Date</span><strong>{new Date(selectedTx.createdAt).toLocaleString('en-NG')}</strong></div><button className="finance-btn" onClick={()=>setSelectedTx(null)}>Close</button></div></div>}
    {rejectId&&<div className="finance-modal-backdrop"><div className="finance-modal"><h3>Reject withdrawal</h3><p>The reserved wallet funds will be returned to the user's available balance.</p><textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Reason for rejection"/><div><button className="finance-btn" onClick={()=>setRejectId(null)}>Cancel</button><button className="finance-btn danger" disabled={!rejectReason.trim()} onClick={async()=>{const id=rejectId;setRejectId(null);await action(id,'reject',{reason:rejectReason});}}>Reject & return funds</button></div></div></div>}
    {otpId&&<div className="finance-modal-backdrop"><div className="finance-modal"><h3>Finalize Paystack transfer</h3><p>Paystack requires the transfer OTP for this payout.</p><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,8))} inputMode="numeric" placeholder="Enter OTP"/><div><button className="finance-btn" onClick={()=>{setOtpId(null);setOtp('')}}>Cancel</button><button className="finance-btn primary" disabled={otp.length<4} onClick={async()=>{const id=otpId;setOtpId(null);await action(id,'finalize',{otp});setOtp('')}}>Finalize transfer</button></div></div></div>}
  </div>
}

function Pagination({page,totalPages,onChange}:{page:number;totalPages:number;onChange:(p:number)=>void}){if(totalPages<=1)return null;return <div className="finance-pagination"><button className="finance-btn" disabled={page<=1} onClick={()=>onChange(page-1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="finance-btn" disabled={page>=totalPages} onClick={()=>onChange(page+1)}>Next</button></div>}

function FinanceTable({transactions,onSelect}:{transactions:Transaction[];onSelect:(t:Transaction)=>void}){if(!transactions.length)return <div className="finance-empty">No financial records found.</div>;return <div className="finance-table"><div className="finance-table-head"><span>Transaction</span><span>User</span><span>Amount</span><span>Status</span><span>Date</span></div>{transactions.map(t=><button type="button" className="finance-table-row finance-table-button" key={`${t.kind}-${t.id}`} onClick={()=>onSelect(t)}><div><b>{t.description}</b><small>{label(t.kind)} · {t.reference??t.id}</small></div><span>{t.name}<small>{t.user}</small></span><strong className={t.source==='WITHDRAWAL'||t.kind==='WITHDRAWAL'?'finance-debit':'finance-credit'}>{t.source==='WITHDRAWAL'||t.kind==='WITHDRAWAL'?'-':'+'}{money(t.amount)}</strong><span className={`finance-status ${String(t.status).toLowerCase()}`}>{t.status==='PAID'?'SUCCESSFUL':t.status}</span><small>{new Date(t.createdAt).toLocaleString('en-NG')}</small></button>)}</div>}
