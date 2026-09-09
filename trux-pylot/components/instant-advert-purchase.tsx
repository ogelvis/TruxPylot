'use client';
import { useEffect, useState } from 'react';

const plans = [
  { months: 1, price: '₦2,000', days: 30 },
  { months: 2, price: '₦3,500', days: 60 },
  { months: 3, price: '₦5,000', days: 90 },
];

export function InstantAdvertPurchase({ activeExpiresAt }: { activeExpiresAt?: string | null }) {
  const [selected, setSelected] = useState(1);
  const [stage, setStage] = useState<'idle'|'redirecting'|'error'>('idle');
  const [error, setError] = useState('');
  async function pay() {
    setStage('redirecting'); setError('');
    try {
      const r = await fetch('/api/advertising/initialize', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ months: selected }) });
      const d = await r.json().catch(() => ({error:'Could not start payment.'}));
      if (!r.ok) throw new Error(d.error || 'Could not start payment.');
      window.location.href = d.authorizationUrl;
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start payment.'); setStage('error'); }
  }
  return <div className="growth-purchase-box">
    {activeExpiresAt && <div className="growth-active"><span>● ADVERT ACTIVE</span><strong>Until {new Intl.DateTimeFormat('en-NG',{dateStyle:'medium'}).format(new Date(activeExpiresAt))}</strong></div>}
    <div className="advert-plan-grid">{plans.map(plan => <button key={plan.months} type="button" className={`advert-plan ${selected===plan.months?'selected':''}`} onClick={()=>setSelected(plan.months)}><span>{plan.months} Month{plan.months>1?'s':''}</span><strong>{plan.price}</strong><small>{plan.days} days</small></button>)}</div>
    {error && <p className="growth-error">{error}</p>}
    <button type="button" className="growth-buy-button" onClick={pay} disabled={stage==='redirecting'}>{stage==='redirecting'?'Redirecting to secure payment…':'Advertise Now →'}</button>
    <small className="growth-payment-note">Paid directly to Trux Pylot through Paystack. Advertising is separate from Tier and Top 10 placement.</small>
  </div>;
}
