'use client';
import { useEffect, useState } from 'react';

type Product={id:string;name:string;durationDays:number;price:number};
type Listing={id:string;expiresAt:string;product:Product};
export function Top10Purchase({ availableBalance }: { availableBalance: number }) {
  const [products,setProducts]=useState<Product[]>([]); const [listings,setListings]=useState<Listing[]>([]); const [selected,setSelected]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function load(){ const r=await fetch('/api/promoted',{cache:'no-store'}); const d=await r.json(); if(r.ok){setProducts(d.products||[]);setListings(d.listings||[]);if(!selected&&d.products?.[0])setSelected(d.products[0].id);} }
  useEffect(()=>{load().catch(()=>setError('Could not load placement options.'));},[]);
  async function buy(){ setBusy(true);setError(''); try{const r=await fetch('/api/promoted',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:selected})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not activate placement.');await load();}catch(e){setError(e instanceof Error?e.message:'Could not activate placement.');}finally{setBusy(false);} }
  return <div className="growth-purchase-box"><div className="growth-balance"><span>Wallet available</span><strong>₦{(availableBalance/100).toLocaleString('en-NG')}</strong></div>{listings.length>0&&<div className="growth-active"><span>● TOP 10 ACTIVE</span><strong>Until {new Intl.DateTimeFormat('en-NG',{dateStyle:'medium'}).format(new Date(listings[0].expiresAt))}</strong></div>}<div className="advert-plan-grid">{products.map(p=><button key={p.id} type="button" className={`advert-plan ${selected===p.id?'selected':''}`} onClick={()=>setSelected(p.id)}><span>{p.durationDays} days</span><strong>₦{(p.price/100).toLocaleString('en-NG')}</strong><small>Wallet payment</small></button>)}</div>{error&&<p className="growth-error">{error}</p>}<button type="button" className="growth-buy-button" onClick={buy} disabled={!selected||busy}>{busy?'Activating…':'Get Top 10 Placement →'}</button><small className="growth-payment-note">Top 10 placement uses your PylotWallet balance and does not change Score, Level or organic ranking.</small></div>;
}
